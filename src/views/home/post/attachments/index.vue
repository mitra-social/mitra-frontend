<template>
  <div>
    <v-row align="center" justify="center" v-if="getAttachments">
      <v-col
        v-for="(attach, index) in getAttachments"
        :key="index"
        class="d-flex child-flex justify-center"
        :md="
          getAttachments.length < 2 ? 12 : getAttachments.length === 2 ? 6 : 4
        "
        sm="12"
      >
        <v-card class="attachment-card" flat tile>
          <component
            :is="getMediaComponent(attach)"
            :attach="attach"
            :postIndex="postIndex"
            :attachIndex="index"
            :isSingle="getAttachments.length === 1"
          />
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import { ActivityObject, Link } from "activitypub-objects";
import { Component, Vue, Prop } from "vue-property-decorator";
import { namespace } from "vuex-class";

import AttachmentImage from "./AttachmentImage.vue";
import AttachmentSimpleLink from "./AttachmentSimpleLink.vue";
import { Attachment } from "@/model/attachment";
import { AddAttachmentsParam } from "@/model/add-attachments-param";

const dialogAttachmentsStore = namespace("DialogAttachments");

@Component({
  components: {
    AttachmentImage,
    AttachmentSimpleLink,
  },
})
export default class ActivityStreamsAttachments extends Vue {
  /************************
   * component properties
   ************************/
  @Prop() readonly attachments!: (ActivityObject | Link | URL)[];
  @Prop() readonly postIndex!: number;

  /**********************
   * computed properties
   **********************/
  get getAttachments(): Attachment[] {
    if (!this.attachments) {
      return [];
    }

    const attachments = this.attachments
      .map<Attachment | undefined>((param: ActivityObject | URL):
        | Attachment
        | undefined => {
        let object = param as ActivityObject;

        if (object.preview) {
          object = object.preview as ActivityObject;
        }

        if (object.type === "Link") {
          const link = object as Link;
          const href: string = link.href.toString();
          return {
            url: href,
            type: link.mediaType,
            title: link.name,
            width: link.width,
            height: link.height,
          };
        }

        if ((param as ActivityObject).type) {
          const url: Link | URL | undefined = !Array.isArray(object.url)
            ? object.url
            : object.url[0];

          if (url === undefined) {
            return undefined;
          }
          if (url.href) {
            const link = url as Link;
            const href: string = link.href.toString();
            return {
              url: href,
              type: link.mediaType,
              title: link.name,
              width: link.width,
              height: link.height,
            };
          }

          return {
            url: url.toString(),
            type: object.mediaType,
            title: object.name,
          };
        }

        return { url: param.toString(), title: object.name };
      })
      .filter((item) => item !== undefined)
      .map((item) => item as Attachment);
    this.addAttachmentsAction({ index: this.postIndex, attachments });
    return attachments;
  }

  /**********************
   * store actions
   **********************/
  @dialogAttachmentsStore.Action
  public addAttachmentsAction!: (attachments: AddAttachmentsParam) => void;

  /**********************
   * public functions
   **********************/
  public getMediaComponent(attach: Attachment): string | undefined {
    if (attach.type && attach.type.startsWith("image/")) {
      return "AttachmentImage";
    }

    return "AttachmentSimpleLink";
  }
}
</script>
<style lang="scss" scoped>
.v-row {
  justify-content: center;
}
.attachment-card {
  background-color: transparent;
}
</style>
