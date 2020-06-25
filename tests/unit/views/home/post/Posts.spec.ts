import Vue from "vue";
import Vuetify from "vuetify";

import { createLocalVue, shallowMount } from "@vue/test-utils";
import flushPromises from "flush-promises";

import store from "@/store";
import router from "@/router";
import Posts from "@/views/home/post/Posts.vue";
import { AuthenticationUtil } from "@/utils/authentication-util";
import { Notify } from "@/model/notify";

const localVue = createLocalVue();
Vue.use(Vuetify);

describe("Posts.vue", () => {
  // eslint-disable-next-line
  let vuetify: any;
  const mockIntersectDirective = () => {
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
    };
  };

  beforeEach(() => {
    vuetify = new Vuetify();

    if (router.currentRoute.path !== "/") {
      router.push({ name: "Home" });
    }

    store.state.User.user = {
      userId: "id",
      email: "test@mail.ch",
      registeredAt: new Date(),
      preferredUsername: "john.doe",
      inbox: "https://social.example/john.doe/inbox/",
    };
    AuthenticationUtil.setUser("john.doe");
    AuthenticationUtil.setToken(
      "5XWdjcQ5n7xqf3G91TjD23EbQzrc-PPu5Xa-D5lNnB9KHLi"
    );
  });

  afterEach(() => {
    AuthenticationUtil.clear();
    store.state.Collection.items = [];
  });

  it("Count posts", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();
    expect(wrapper.findAll(".post").length).toBe(9);
  });

  it("First post is article type", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();
    expect(
      wrapper.findAll(".post").at(0).find("v-list-item-title-stub").text()
    ).toBe("Minecraft Signs");
    expect(
      wrapper
        .findAll(".post")
        .at(0)
        .find("ActivityStreamsArticleType-stub")
        .exists()
    ).toBe(true);
  });

  it("First post is note type", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();
    expect(
      wrapper.findAll(".post").at(3).find("v-list-item-title-stub").text()
    ).toBe("A note");
    expect(
      wrapper
        .findAll(".post")
        .at(3)
        .find("ActivityStreamsNoteType-stub")
        .exists()
    ).toBe(true);
  });

  it("Has published date", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();

    const updateDate = wrapper
      .findAll(".post")
      .at(4)
      .findAll("date-stub")
      .at(0);
    expect(updateDate.attributes().icon).toBe("mdi-publish");
    expect(updateDate.attributes().date).toBe("2020-04-28T16:12:12Z");
  });

  it("Has updated date", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();

    const updateDate = wrapper
      .findAll(".post")
      .at(4)
      .findAll("date-stub")
      .at(1);
    expect(updateDate.attributes().icon).toBe("mdi-update");
    expect(updateDate.attributes().date).toBe("2020-04-28T17:49:12Z");
  });

  it("Wrong user", async (done) => {
    AuthenticationUtil.setUser("jenny.moe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    wrapper.vm.$store.subscribe((mutation, state) => {
      if (mutation.type === "Notify/setNofify") {
        const notification: Notify = state.Notify.notification;
        expect(notification.message).toBe("Authentication is incorrect");
      }
    });
    done();
  });

  it("Has no post", async () => {
    AuthenticationUtil.setUser("john.doe");
    const wrapper = shallowMount(Posts, {
      localVue,
      vuetify,
      store,
      directives: { Intersect: mockIntersectDirective },
    });
    await flushPromises();
    store.state.Collection.items = [];
    await flushPromises();
    expect(wrapper.findAll(".post").length).toBe(1);
    expect(wrapper.find("v-card-text-stub").text()).toContain(
      "You haven't got any posts yet because"
    );
  });
});
