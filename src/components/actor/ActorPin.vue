<template>
  <v-menu
    open-on-hover
    top
    offset-y
    :close-on-content-click="false"
    :nudge-width="200"
  >
    <template v-slot:activator="{ on }">
      <div v-on="on">
        <v-avatar color="indigo" size="36" v-if="icon">
          <v-img :src="icon"></v-img>
        </v-avatar>
        <v-avatar color="indigo" size="36" v-else>
          <v-icon dark>mdi-account-circle</v-icon>
        </v-avatar>
        {{ name }}
      </div>
    </template>
    <SummarizedActor v-if="this.actor" :actor="this.actor" />
  </v-menu>
</template>

<script lang="ts">
import { ActivityObject, Link } from "activitypub-objects";
import { Component, Vue, Prop } from "vue-property-decorator";

import client from "apiClient";
import SummarizedActor from "@/components/actor/ActorSummarized.vue";
import { ActivityObjectHelper } from "@/utils/activity-object-helper";

@Component({
  components: {
    SummarizedActor,
  },
})
export default class ActorPin extends Vue {
  /************************
   * components properties
   ************************/
  @Prop() readonly actor!:
    | ActivityObject
    | Link
    | URL
    | Array<ActivityObject | URL>;

  /**********************
   * computed properties
   **********************/
  get name(): string | undefined {
    return ActivityObjectHelper.extractActorName(this.actor as ActivityObject);
  }

  get icon(): string | undefined {
    const originalIconUri = ActivityObjectHelper.extractIcon(
      this.actor as ActivityObject
    );

    return client.getMedia(originalIconUri);
  }
}
</script>
