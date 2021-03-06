import { Activity, OrderedCollectionPage } from "activitypub-objects";
import Vue from "vue";
import Vuetify from "vuetify";
import { mount, createLocalVue } from "@vue/test-utils";

import collection from "@/api-client/mock/data/collection-page-1.json";
import ActivityStreamsTextType from "@/views/home/post/text-type/ActivityStreamsTextType.vue";

const localVue = createLocalVue();
Vue.use(Vuetify);

describe("@/views/home/post/text-type/ActivityStreamsTextType.vue", () => {
  let article: Activity;
  // eslint-disable-next-line
  let vuetify: any;

  beforeEach(() => {
    const articles = (collection as OrderedCollectionPage)
      .orderedItems as Activity[];
    article = articles[1];
    vuetify = new Vuetify();
  });

  it("Check data has right content", () => {
    const wrapper = mount(ActivityStreamsTextType, {
      localVue,
      propsData: {
        data: article.object,
      },
      vuetify,
    });

    expect(wrapper.find("span").exists()).toBe(true);
    expect(wrapper.find("span").text()).toContain("SAVIOR OF SONG");
  });
});
