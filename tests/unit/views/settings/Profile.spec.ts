import flushPromises from "flush-promises";
import Vue from "vue";
import Vuetify from "vuetify";
import { mount, createLocalVue } from "@vue/test-utils";

import * as userData from "@/api-client/mock/data/user.json";
import { InternalActor } from "@/model/internal-actor";
import "@/plugins/date-fns";
import store from "@/store";
import { AuthenticationUtil } from "@/utils/authentication-util";
import Profile from "@/views/settings/Profile.vue";

const localVue = createLocalVue();
Vue.use(Vuetify);

describe("@/views/settings/Password.vue", () => {
  // eslint-disable-next-line
  const user = (userData as any) as InternalActor;
  // eslint-disable-next-line
  let vuetify: any;

  beforeEach(async () => {
    store.state.User.user = user;

    vuetify = new Vuetify();

    jest.spyOn(AuthenticationUtil, "getUser").mockReturnValue("john.doe");
    jest
      .spyOn(AuthenticationUtil, "getToken")
      .mockReturnValue("5XWdjcQ5n7xqf3G91TjD23EbQzrc-PPu5Xa-D5lNnB9KHLi");
    await flushPromises();
  });

  it("Update preferredUsername", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const newName = "ben.doe";

    expect(store.state.User.user.preferredUsername).toBe(
      user.preferredUsername
    );

    const input = wrapper.find('input[name="preferredUsername"]');
    input.setValue(newName);
    await flushPromises();

    wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(store.state.User.user.preferredUsername).toBe(newName);
  });

  it("User name is too short", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const input = wrapper.find('input[name="preferredUsername"]');
    input.setValue("foo");
    await flushPromises();

    expect(
      wrapper
        .findAll(".v-input__control")
        .at(0)
        .find(".v-messages__message")
        .text()
    ).toBe("This value is too short. It should have 5 characters or more.");
  });

  it("Update email address", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const newEmail = "new@mail.org";
    expect(store.state.User.user.email).toBe(user.email);

    const input = wrapper.find('input[name="email"]');
    input.setValue(newEmail);
    await flushPromises();

    wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(store.state.User.user.email).toBe(newEmail);
  });

  it("Email is required", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const input = wrapper.find('input[name="email"]');
    input.setValue("");

    await flushPromises();
    expect(
      wrapper
        .findAll(".v-input__control")
        .at(1)
        .find(".v-messages__message")
        .text()
    ).toBe("Required.");
  });

  it("Email must be valid", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const input = wrapper.find('input[name="email"]');
    input.setValue("new@mail");
    await flushPromises();

    expect(
      wrapper
        .findAll(".v-input__control")
        .at(1)
        .find(".v-messages__message")
        .text()
    ).toBe("E-mail must be valid.");
  });

  it("Check registered at", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });

    expect(store.state.User.user.registeredAt).toBe(user.registeredAt);

    wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(store.state.User.user.registeredAt).toBe(user.registeredAt);
  });

  it("Update summary", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });
    const newSummary = "Info about john doe";

    expect(store.state.User.user.summary).toBe(user.summary);

    const input = wrapper.find('textarea[name="summary"]');
    input.setValue(newSummary);
    await flushPromises();

    wrapper.find("form").trigger("submit.prevent");
    await flushPromises();

    expect(store.state.User.user.summary).toBe(newSummary);
  });

  it("Close password dialog window", async () => {
    const wrapper = mount(Profile, { localVue, store, vuetify });

    store.state.Dialog.isOpen = true;
    expect(store.state.Dialog.isOpen).toBeTruthy();
    wrapper.find("#close-btn").trigger("click");

    await flushPromises();
    expect(store.state.Dialog.isOpen).toBeFalsy();
  });
});
