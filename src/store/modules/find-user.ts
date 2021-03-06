import {
  Actor,
  ActivityObject,
  Link,
  OrderedCollectionPage,
} from "activitypub-objects";
import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import client from "apiClient";
import { FetchFollowParam } from "@/model/fetch-follow-param";
import { InternalActor } from "@/model/internal-actor";

/**********************
 * Helper functions
 **********************/
function normalizedCollection(
  collection: OrderedCollectionPage
): Promise<(ActivityObject | Link | URL | undefined)[]> {
  return Promise.all(
    collection.orderedItems.map(async (item: ActivityObject | Link | URL) => {
      const url = typeof item === "string" ? item : (item as Actor).id;

      if (url) {
        return await client
          .fediverseGetActor(url.toString())
          .then(($) => {
            if ($) {
              item = $;
            }
            return item;
          })
          .catch(() => Promise.resolve(undefined));
      }
    })
  );
}

@Module({ namespaced: true })
class FindUserStore extends VuexModule {
  public loadingState = false;
  public query = "";
  public user: InternalActor | undefined = undefined;
  /**********************
   * followers state
   **********************/
  public followerCollectionPage: (
    | ActivityObject
    | Link
    | URL
    | undefined
  )[] = [];
  public followerCollectionItemCount = 0;
  public followerCollectionPaging = 0;
  public hasNextFollowerPage = false;
  public isFollowerLoadingState = false;
  /**********************
   * followings state
   **********************/
  public followingCollectionPage: (
    | ActivityObject
    | Link
    | URL
    | undefined
  )[] = [];
  public followingCollectionItemCount = 0;
  public followingCollectionPaging = 0;
  public hasNextFollowingPage = false;
  public isFollowingLoadingState = false;

  get isLoading(): boolean {
    return this.loadingState;
  }

  get getQuery(): string {
    return this.query;
  }

  get getUser(): InternalActor | undefined {
    return this.user;
  }

  /**********************
   * followers getters
   **********************/
  get getFollowers(): (ActivityObject | Link | URL | undefined)[] {
    return this.followerCollectionPage.filter(($) => $ !== undefined);
  }

  get getFollowersCollectionCount(): number | undefined {
    return this.followerCollectionItemCount;
  }

  get isFollowersLoading(): boolean {
    return this.isFollowerLoadingState;
  }

  get getHasNextFollowerPage(): boolean {
    return this.hasNextFollowerPage;
  }

  /**********************
   * followings getters
   **********************/
  get getFollowingCollectionCount(): number | undefined {
    return this.followingCollectionItemCount;
  }

  get getFollowing(): (ActivityObject | Link | URL | undefined)[] {
    return this.followingCollectionPage.filter(($) => $ !== undefined);
  }

  get isFollowingLoading(): boolean {
    return this.isFollowingLoadingState;
  }

  get getHasNextFollowingPage() {
    return this.hasNextFollowingPage;
  }

  @Mutation
  public initialState(): void {
    this.query = "";
    this.user = undefined;
    this.loadingState = false;

    this.followerCollectionPage = [];
    this.followerCollectionItemCount = 0;
    this.followerCollectionPaging = 0;
    this.hasNextFollowerPage = false;
    this.isFollowerLoadingState = false;

    this.followingCollectionPage = [];
    this.followingCollectionItemCount = 0;
    this.followingCollectionPaging = 0;
    this.hasNextFollowingPage = false;
    this.isFollowingLoadingState = false;
  }

  @Mutation
  public loadingStart(): void {
    this.loadingState = true;
  }

  @Mutation
  public loadingFinish(): void {
    this.loadingState = false;
  }

  @Mutation
  public setQuery(query: string): void {
    this.query = query;
  }

  @Mutation
  public setUser(user: InternalActor): void {
    this.user = user;
  }

  /**********************
   * followings mutations
   **********************/
  @Mutation
  public setFollowers(
    followerCollectionPage: (ActivityObject | Link | URL | undefined)[]
  ): void {
    this.followerCollectionPage = followerCollectionPage;
  }

  @Mutation
  public addFollowers(
    followerCollectionPage: (ActivityObject | Link | URL | undefined)[]
  ): void {
    this.followerCollectionPage = this.followerCollectionPage.concat(
      followerCollectionPage
    );
  }

  @Mutation
  public setFollowerCollectionCount(count: number): void {
    this.followerCollectionItemCount = count;
  }

  @Mutation
  public setFollowerCollectionPaging(page: number): void {
    this.followerCollectionPaging = page;
  }

  @Mutation
  public setHasNextFollowerPage(hasNext: boolean): void {
    this.hasNextFollowerPage = hasNext;
  }

  @Mutation
  public loadingFollowerStart(): void {
    this.isFollowerLoadingState = true;
  }

  @Mutation
  public loadingFollowerFinish(): void {
    this.isFollowerLoadingState = false;
  }

  /**********************
   * followings mutations
   **********************/
  @Mutation
  public addFollowing(
    followingCollectionPage: (ActivityObject | Link | URL | undefined)[]
  ): void {
    this.followingCollectionPage = this.followingCollectionPage.concat(
      followingCollectionPage
    );
  }

  @Mutation
  public setFollowing(
    followingCollectionPage: (ActivityObject | Link | URL | undefined)[]
  ): void {
    this.followingCollectionPage = followingCollectionPage;
  }

  @Mutation
  public setFollowingCollectionPage(page: number): void {
    this.followingCollectionPaging = page;
  }

  @Mutation
  public setFollowingCount(count: number): void {
    this.followingCollectionItemCount = count;
  }

  @Mutation
  public setHasNextFollowingPage(hasNext: boolean): void {
    this.hasNextFollowingPage = hasNext;
  }

  @Mutation
  public loadingFollowingStart(): void {
    this.isFollowingLoadingState = true;
  }

  @Mutation
  public loadingFollowingFinish(): void {
    this.isFollowingLoadingState = false;
  }

  @Action({ rawError: true })
  public async findUser(query: string): Promise<void> {
    this.context.commit("loadingStart");

    await client
      .fediverseSearchUserId(query)
      .then(async (id) => {
        if (id) {
          await client.fediverseGetUser(id).then((user) => {
            this.context.dispatch("fetchFollowers", {
              url: user.followers,
              add: false,
            });
            this.context.dispatch("fetchFollowing", {
              url: user.following,
              add: false,
            });
            this.context.commit("setUser", user);
          });
        }
      })
      .finally(() => this.context.commit("loadingFinish"));
  }

  @Action({ rawError: true })
  public detailUser(user: InternalActor): void {
    this.context.commit("loadingStart");
    this.context.dispatch("fetchFollowers", {
      url: user.followers,
      add: false,
    });
    this.context.dispatch("fetchFollowing", {
      url: user.following,
      add: false,
    });
    this.context.commit("setUser", user);
    this.context.commit("loadingFinish");
  }

  @Action({ rawError: true })
  public queryAction(query: string): void {
    this.context.commit("initialState");
    this.context.commit("setQuery", query);
  }

  @Action({ rawError: true })
  public reset(): void {
    this.context.commit("initialState");
  }

  /**********************
   * followers action
   **********************/
  @Action({ rawError: true })
  public fetchFollowers({ url, add }: FetchFollowParam): void {
    this.context.commit("loadingFollowerStart");
    add
      ? this.context.commit(
          "setFollowerCollectionPaging",
          this.followerCollectionPaging + 1
        )
      : this.context.commit("setFollowerCollectionPaging", 1);

    client
      .fediversGetCollection(`${url}?page=${this.followerCollectionPaging}`)
      .then((collection) => {
        this.context.commit(
          "setFollowerCollectionCount",
          collection.totalItems
        );
        this.context.commit("setHasNextFollowerPage", !!collection.next);
        return collection;
      })
      .then((collection) => normalizedCollection(collection))
      .then((collection) => {
        add
          ? this.context.commit("addFollowers", collection)
          : this.context.commit("setFollowers", collection);
      })
      .finally(() => this.context.commit("loadingFollowerFinish"));
  }

  /**********************
   * followings action
   **********************/
  @Action({ rawError: true })
  public fetchFollowing({ url, add }: FetchFollowParam): void {
    this.context.commit("loadingFollowingStart");
    add
      ? this.context.commit(
          "setFollowingCollectionPage",
          this.followingCollectionPaging + 1
        )
      : this.context.commit("setFollowingCollectionPage", 1);

    client
      .fediversGetCollection(`${url}?page=${this.followingCollectionPaging}`)
      .then((collection) => {
        this.context.commit("setFollowingCount", collection.totalItems);
        this.context.commit("setHasNextFollowingPage", !!collection.next);
        return collection;
      })
      .then((collection) => normalizedCollection(collection))
      .then((collection) => {
        if (add) {
          this.context.commit("addFollowing", collection);
        } else {
          this.context.commit("setFollowing", collection);
        }
      })
      .finally(() => this.context.commit("loadingFollowingFinish"));
  }
}
export default FindUserStore;
