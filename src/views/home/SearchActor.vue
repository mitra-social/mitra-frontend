<template>
  <v-container fluid>
    <div class="d-flex flex-row align-stretch">
      <v-text-field
        id="search-field"
        flat
        solo-inverted
        hide-details
        label="Search Actor"
        v-model="query"
        :loading="isLoading"
        @keyup.enter="searchUser(query)"
      ></v-text-field>
      <v-btn
        id="search-btn"
        class="ml-1 pa-0"
        height="auto"
        @click="searchUser(query)"
        :light="$vuetify.theme.dark"
        :dark="!$vuetify.theme.dark"
        :loading="isLoading"
      >
        <v-icon left>mdi-magnify</v-icon>
      </v-btn>
    </div>
    <v-alert
      class="mt-1"
      border="bottom"
      colored-border
      type="info"
      elevation="2"
      icon="mdi-account-search-outline"
      v-if="noContent"
    >
      <p>
        No user found. You can search for and follow a user by entering its full
        id in the search field above.
      </p>
      <p>
        Example:<br />
        user@example.com<br />
        fraenki@mastodon.social
      </p>
    </v-alert>
    <v-list v-if="getUser">
      <v-list-item-group color="primary">
        <v-list-item>
          <v-list-item-content>
            <SummarizedActor :actor="getUser" />
            <v-divider></v-divider>
            <div class="d-flex flex-row">
              <v-btn
                id="search-actor-followers-btn"
                class="ma-2"
                @click="setfollowersOrFollowing(true, false)"
                :light="$vuetify.theme.dark"
                :dark="!$vuetify.theme.dark"
                :loading="isFollowersLoading"
              >
                <v-icon left>mdi-account</v-icon>
                {{ getFollowersCollectionCount }} Followers
              </v-btn>
              <v-btn
                id="search-actor-following-btn"
                class="ma-2"
                @click="setfollowersOrFollowing(false, true)"
                :light="$vuetify.theme.dark"
                :dark="!$vuetify.theme.dark"
                :loading="isFollowingLoading"
              >
                <v-icon left>mdi-account</v-icon>
                {{ getFollowingCollectionCount }} Follows
              </v-btn>
            </div>
            <ActorList
              v-if="isFollowerActive"
              :actors="getFollowers"
              :isLoading="isFollowersLoading"
              :hasNextPage="getHasNextFollowerPage"
              @nextPage="nextFollowersPage()"
              @detail="detail($event)"
            />
            <ActorList
              v-if="isFollowingActive"
              :actors="getFollowing"
              :isLoading="isFollowingLoading"
              :hasNextPage="getHasNextFollowingPage"
              @nextPage="nextFollowingPage()"
              @detail="detail($event)"
            />
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-container>
</template>

<script lang="ts">
import { ActivityObject, Link } from "activitypub-objects";
import { Component, Vue } from "vue-property-decorator";
import { namespace } from "vuex-class";

import ActorList from "@/components/actor/ActorList.vue";
import { FetchFollowParam } from "@/model/fetch-follow-param";
import FollowingActor from "@/components/following/FollowingActor.vue";
import { InternalActor } from "@/model/internal-actor";
import SummarizedActor from "@/components/actor/ActorSummarized.vue";

const findUserStore = namespace("FindUser");

@Component({
  components: {
    ActorList,
    FollowingActor,
    SummarizedActor,
  },
})
export default class SearchRemoteActor extends Vue {
  public isFollowerActive = false;
  public isFollowingActive = false;
  public noContent = true;
  public tab = "";

  /**********************
   * computed properties
   **********************/
  get query() {
    return this.getQuery;
  }

  set query(value: string) {
    this.noContent = false;
    this.queryAction(value);
  }

  /**********************
   * store getters
   **********************/
  // find user
  @findUserStore.Getter
  public getQuery!: string;

  @findUserStore.Getter
  public getUser!: InternalActor;

  @findUserStore.Getter
  public isLoading!: boolean;

  // follower
  @findUserStore.Getter
  public getFollowersCollectionCount!: number;

  @findUserStore.Getter
  public getFollowers!: (ActivityObject | Link | URL)[] | undefined;

  @findUserStore.Getter
  public isFollowersLoading!: boolean;

  @findUserStore.Getter
  public getHasNextFollowerPage!: boolean;

  // following
  @findUserStore.Getter
  public getFollowingCollectionCount!: number;

  @findUserStore.Getter
  public getFollowing!: (ActivityObject | Link | URL)[] | undefined;

  @findUserStore.Getter
  public isFollowingLoading!: boolean;

  @findUserStore.Getter
  public getHasNextFollowingPage!: boolean;

  /**********************
   * store actions
   **********************/
  // find user
  @findUserStore.Action
  public findUser!: (query: string) => Promise<void>;

  @findUserStore.Action
  public detailUser!: (actor: InternalActor) => void;

  @findUserStore.Action
  public queryAction!: (query: string) => void;

  // follower
  @findUserStore.Action
  public fetchFollowers!: ({ url, add }: FetchFollowParam) => void;

  // following
  @findUserStore.Action
  public fetchFollowing!: ({ url, add }: FetchFollowParam) => void;

  /**********************
   * public functions
   **********************/
  public detail(actor: InternalActor): void {
    this.queryAction("");
    this.detailUser(actor);
  }

  public nextFollowersPage(): void {
    this.fetchFollowers({ url: this.getUser.followers, add: true });
  }

  public nextFollowingPage(): void {
    this.fetchFollowing({ url: this.getUser.following, add: true });
  }

  public setfollowersOrFollowing(
    isFollowerActive: boolean,
    isFollowingActive: boolean
  ): void {
    this.isFollowerActive = isFollowerActive;
    this.isFollowingActive = isFollowingActive;
  }

  public searchUser(query: string): void {
    this.findUser(query).catch(() => (this.noContent = true));
  }
}
</script>

<style lang="scss" scoped>
h2 {
  margin-block-start: 0;
  margin-block-end: 0;
}

.action-all {
  padding-left: 32px;
}

.follower-container {
  height: 100%;
  overflow: scroll;
}

.post-container {
  height: 100%;
  overflow-y: scroll;
}
</style>
