<template>
  <div
    id="scroll-target"
    class="post-container"
    v-if="actors && actors.length > 0"
  >
    <v-list>
      <v-list-item-group color="primary">
        <v-list-item
          class="actor-short-list"
          v-for="(actor, index) in actors"
          v-intersect="onIntersect"
          :key="index"
          :data-index="index"
          @click="detail(actor)"
        >
          <v-list-item-content>
            <SummarizedActor :actor="actor" :noSummary="true" />
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
    <v-progress-linear
      indeterminate
      height="15"
      absolute
      bottom
      :light="$vuetify.theme.dark"
      :dark="!$vuetify.theme.dark"
      :active="isLoading"
    >
      <template v-slot>
        <strong class="caption">loading more...</strong>
      </template></v-progress-linear
    >
  </div>
</template>

<script lang="ts">
import { ActivityObject, Link } from "activitypub-objects";
import { Component, Vue, Prop, Emit } from "vue-property-decorator";

import FollowingActor from "@/components/following/FollowingActor.vue";
import SummarizedActor from "@/components/actor/ActorSummarized.vue";
import { InternalActor } from "@/model/internal-actor";

@Component({
  components: {
    FollowingActor,
    SummarizedActor,
  },
})
export default class ActorList extends Vue {
  @Prop() readonly actors!: (ActivityObject | Link | URL)[];
  @Prop() readonly isLoading!: boolean;
  @Prop() readonly hasNextPage!: boolean;

  @Emit()
  public detail(actor: InternalActor): InternalActor {
    return actor;
  }

  /**********************
   * public functions
   **********************/
  public onIntersect(entries: IntersectionObserverEntry[]): void {
    if (this.hasNextPage && entries[0].isIntersecting) {
      const target: Element = entries[0].target as Element;
      const index: number = +(target.getAttribute("data-index") ?? 0);

      if (index > this.actors.length - 3 && !this.isLoading) {
        this.$emit("nextPage");
      }
    }
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
