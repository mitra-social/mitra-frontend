import {
  Activity,
  ActivityObject,
  Link,
  OrderedCollectionPage,
} from "activitypub-objects";
import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import client from "apiClient";
import { ActivityObjectHelper } from "@/utils/activity-object-helper";
import { AuthenticationUtil } from "@/utils/authentication-util";
import { PostTypes } from "@/utils/post-types";

/**********************
 * Helper functions
 **********************/
function normalizedAttachment(
  items: (ActivityObject | Link | URL | undefined)[]
): Promise<(ActivityObject | Link | URL | undefined)[]> {
  return Promise.all(
    items
      .filter(($) => !!$)
      .map(async (item: ActivityObject | Link | URL | undefined) => {
        let attachments: (ActivityObject | Link | URL)[] = [];

        const activity = item as Activity;
        if (activity.object) {
          const object = activity.object as ActivityObject;

          if (object.attachment) {
            if (Array.isArray(object.attachment)) {
              attachments = object.attachment;
            } else {
              attachments.push(object.attachment);
            }

            ((item as Activity)
              .object as ActivityObject).attachment = attachments
              .filter(($: ActivityObject | Link | URL) => !!$)
              .map(($: ActivityObject | Link | URL) =>
                ActivityObjectHelper.extractAttachmentLink($)
              );
          }
        }
        return item;
      })
  );
}

function normalizedCollection(
  collection: OrderedCollectionPage
): Promise<(ActivityObject | Link | URL | undefined)[]> {
  return Promise.all(
    collection.orderedItems.map(async (item: ActivityObject | Link | URL) => {
      if (
        (item as ActivityObject).type !== "Link" &&
        (typeof (item as ActivityObject).attributedTo === "string" ||
          typeof (item as Activity).actor === "string")
      ) {
        const url =
          (item as Activity).actor ?? (item as ActivityObject).attributedTo;

        if (!url) {
          return item;
        }

        return await client
          .fediverseGetActor(url.toString())
          .then(($) => {
            if (!$) {
              return item;
            }

            if ((item as Activity).actor) {
              (item as Activity).actor = $;
            } else if ((item as ActivityObject).attributedTo) {
              (item as ActivityObject).attributedTo = $;
            }

            return item;
          })
          .catch(() => {
            return Promise.resolve(undefined);
          });
      } else {
        return item;
      }
    })
  );
}

@Module({ namespaced: true })
class Collection extends VuexModule {
  public filter: string | undefined = undefined;
  public hasNext = true;
  public hasPrev = false;
  public items: Array<ActivityObject | Link> = [];
  public loadMorePostState = false;
  public page = 0;
  public partOf = "";
  public totalItems = 0;

  get getHasNextPage(): boolean {
    return this.hasNext;
  }

  get getHasPrevPage(): boolean {
    return this.hasPrev;
  }

  get getLoadMorePostState(): boolean {
    return this.loadMorePostState;
  }

  get getPage(): number {
    return this.page;
  }

  get getPartOf(): string {
    return this.partOf;
  }

  get getPosts(): (ActivityObject | Link)[] | undefined {
    if (!this.items) {
      return;
    }

    const postTypeItems = this.items.filter(($) => $ && $.type in PostTypes);

    const activityItems = this.items
      .filter(($) => $ && !($.type in PostTypes))
      .filter(
        ($: Activity) =>
          !!$.object &&
          ActivityObjectHelper.hasProperty($.object, "type") &&
          ($.object as ActivityObject).type in PostTypes
      )
      .map(ActivityObjectHelper.extractObjectFromActivity);
    const posts = postTypeItems.concat(activityItems);
    return posts;
  }

  get getTotalItems(): number {
    return this.totalItems;
  }

  @Mutation
  public setFilter(filter: string) {
    this.filter = filter;
  }

  @Mutation
  public setHasPrev(hasPrev: boolean): void {
    this.hasPrev = hasPrev;
  }

  @Mutation
  public setHasNext(hasNext: boolean): void {
    this.hasNext = hasNext;
  }

  @Mutation
  public addItems(items: Array<ActivityObject | Link>): void {
    this.items = this.items.concat(items);
  }

  @Mutation
  public setItems(items: Array<ActivityObject | Link>): void {
    this.items = items;
  }

  @Mutation
  public setLoadMorePostState(isLoading: boolean): void {
    this.loadMorePostState = isLoading;
  }

  @Mutation
  public nextPage(): void {
    this.page++;
  }

  @Mutation
  public setPage(page: number): void {
    this.page = page;
  }

  @Mutation
  public reset() {
    this.items = [];
    this.partOf = "";
    this.totalItems = 0;
    this.page = 0;
    this.hasPrev = false;
    this.hasNext = true;
    this.loadMorePostState = false;
  }

  @Action({ rawError: true })
  public async fetchCollection(user: string): Promise<void> {
    this.context.commit("reset");
    this.context.commit("setLoadMorePostState", true);

    const token = AuthenticationUtil.getToken() || "";
    return await client
      .fetchPosts(token, user, this.page, this.filter)
      .then((collection: OrderedCollectionPage) => {
        this.context.commit("setHasPrev", !!collection.prev);
        this.context.commit("setHasNext", !!collection.next);
        return collection;
      })
      .then((collection: OrderedCollectionPage) =>
        normalizedCollection(collection)
      )
      .then((items: (ActivityObject | Link | URL | undefined)[]) =>
        normalizedAttachment(items)
      )
      .then((items) => this.context.commit("setItems", items))
      .catch((error: Error) =>
        this.context.dispatch("Notify/error", error.message, { root: true })
      )
      .finally(() => this.context.commit("setLoadMorePostState", false));
  }

  @Action({ rawError: true })
  public async nextCollectionPage(user: string): Promise<void> {
    this.context.commit("setLoadMorePostState", true);

    const token = AuthenticationUtil.getToken() || "";
    this.context.commit("nextPage");

    return await client
      .fetchPosts(token, user, this.page, this.filter)
      .then((collection: OrderedCollectionPage) => {
        this.context.commit("setHasPrev", !!collection.prev);
        this.context.commit("setHasNext", !!collection.next);
        return collection;
      })
      .then((collection: OrderedCollectionPage) =>
        normalizedCollection(collection)
      )
      .then((items: (ActivityObject | Link | URL | undefined)[]) =>
        normalizedAttachment(items)
      )
      .then((items: (ActivityObject | Link | URL | undefined)[]) => {
        this.context.commit("addItems", items);
      })
      .catch((error: Error) => {
        this.context.dispatch("Notify/error", error.message, { root: true });
      })
      .finally(() => this.context.commit("setLoadMorePostState", false));
  }

  @Action({ rawError: true })
  public filterAction(filter: string): void {
    if (!filter) {
      this.context.dispatch(
        "Notify/warning",
        "Filter for this actor not possible.",
        { root: true }
      );
      return;
    }
    const user = AuthenticationUtil.getUser() || "";
    this.context.commit("setPage", 0);
    this.context.commit("setFilter", filter);
    this.context.dispatch("fetchCollection", user);
  }

  @Action({ rawError: true })
  public clearfilterAction(): void {
    const user = AuthenticationUtil.getUser() || "";
    this.context.commit("setFilter", undefined);
    this.context.dispatch("fetchCollection", user);
  }
}

export default Collection;
