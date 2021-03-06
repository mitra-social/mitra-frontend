import { Activity, OrderedCollectionPage } from "activitypub-objects";
import Vue from "vue";
import Vuetify from "vuetify";
import { createLocalVue, shallowMount } from "@vue/test-utils";

import collection from "@/api-client/mock/data/collection-page-1.json";
import "@/plugins/date-fns";
import Post from "@/views/home/post/Post.vue";

const localVue = createLocalVue();
Vue.use(Vuetify);

describe("@/views/home/post/Post.vue", () => {
  let activities: Activity[];
  // eslint-disable-next-line
  let vuetify: any;

  beforeEach(async () => {
    activities = (collection as OrderedCollectionPage)
      .orderedItems as Activity[];
    vuetify = new Vuetify();
  });

  it("Post is article type", () => {
    const post = activities[0].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find(".post").find("v-list-item-title-stub").text()).toBe(
      "Minecraft Signs"
    );
    expect(
      wrapper.find(".post").find("ActivityStreamsArticleType-stub").exists()
    ).toBe(true);
  });

  it("Post is note type", () => {
    const post = activities[3].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find(".post").find("v-list-item-title-stub").text()).toBe(
      "A note"
    );
    expect(
      wrapper.find(".post").find("ActivityStreamsNoteType-stub").exists()
    ).toBe(true);
  });

  it("Has published date", () => {
    const post = activities[4].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    const updateDate = wrapper.find(".post").findAll("date-stub").at(0);
    expect(updateDate.attributes().icon).toBe("mdi-publish");
    expect(updateDate.attributes().date).toBe("2020-04-28T16:12:12Z");
  });

  it("Has updated date", () => {
    const post = activities[4].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    const updateDate = wrapper.find(".post").findAll("date-stub").at(1);
    expect(updateDate.attributes().icon).toBe("mdi-update");
    expect(updateDate.attributes().date).toBe("2020-04-28T17:49:12Z");
  });

  it("Post with 1 attachment", () => {
    const post = activities[0].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find("attachments-stub").attributes("attachments")).toBe(
      "[object Object]"
    );
  });

  it("Post with 5 attachments", () => {
    const post = activities[2].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find("attachments-stub").attributes("attachments")).toBe(
      "[object Object],[object Object],[object Object],[object Object],[object Object]"
    );
  });

  it("Post with an empty attachment will not render an attachment in the post", () => {
    const post = activities[10].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find("attachments-stub").exists()).toBe(false);
  });

  it("Post without attachment will not render an attachment in the post", () => {
    const post = activities[5].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find("attachments-stub").exists()).toBe(false);
  });

  it("Post is repley to", () => {
    const post = activities[0].object;
    const wrapper = shallowMount(Post, {
      localVue,
      propsData: {
        post,
      },
      vuetify,
    });

    expect(wrapper.find("v-expansion-panel-stub").exists()).toBe(true);
    expect(wrapper.find("post-stub").exists()).toBe(true);
  });
});
