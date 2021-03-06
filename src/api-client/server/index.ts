import axios, { AxiosError } from "axios";
import md5 from "md5";
import {
  OrderedCollectionPage,
  CollectionPage,
  toJSON,
  ActivityObject,
  Actor,
  Activity,
} from "activitypub-objects";

import { ApiClient } from "@/api-client";
import { Credential } from "@/model/credential";
import { CreateUser } from "@/model/create-user";
import { InternalActor } from "@/model/internal-actor";
import { UpdateUser } from "@/model/update-user";
import { Violation } from "@/model/violation";
import { Webfinger } from "@/model/webfinger";
import router from "@/router";

const urlPrefix = process.env.NODE_ENV === "production" ? "/api" : "";

const config = {
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
};

const catchError = (error: AxiosError): Promise<void> => {
  if (error.response) {
    if (error.response.status === 401) {
      router.push({ name: "Login" });
      return Promise.reject(
        new Error("Authentication failed. Please log in again")
      ) as Promise<void>;
    }

    if (error.response.data.detail) {
      return Promise.reject(new Error(error.response.data.detail)) as Promise<
        void
      >;
    }

    if (error.response.data.violations) {
      const msg = error.response.data.violations
        .map(($: Violation) => $.message)
        .join("\n");
      return Promise.reject(new Error(msg)) as Promise<void>;
    }
  }
  return Promise.reject(new Error(error.message)) as Promise<void>;
};

export default {
  async login(credential: Credential): Promise<string> {
    return await axios
      .post(`${urlPrefix}/token`, credential, config)
      .then((resp) => {
        return resp.data.token;
      });
  },
  async createUser(user: CreateUser): Promise<void> {
    return await axios
      .post(`${urlPrefix}/user`, user, config)
      .then(() => {
        return;
      })
      .catch(catchError);
  },
  async updateProfile(
    token: string,
    user: string,
    updateProfile: UpdateUser
  ): Promise<InternalActor> {
    return await axios
      .patch(`${urlPrefix}/user/${user}`, updateProfile, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        return resp.data;
      })
      .catch(catchError);
  },
  async getUser(token: string): Promise<InternalActor> {
    return await axios
      .get(`${urlPrefix}/me`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        return resp.data;
      })
      .catch(catchError);
  },
  async fetchFollowing(
    token: string,
    user: string,
    page: number
  ): Promise<CollectionPage> {
    return await axios
      .get(`${urlPrefix}/user/${user}/following?page=${page}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        return resp.data;
      })
      .catch(catchError);
  },
  async fetchFollowers(
    token: string,
    user: string,
    page: number
  ): Promise<CollectionPage> {
    return await axios
      .get(`${urlPrefix}/user/${user}/follower?page=${page}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        return resp.data;
      })
      .catch(catchError);
  },
  async fetchPosts(
    token: string,
    user: string,
    page: number,
    filter?: string
  ): Promise<OrderedCollectionPage> {
    const filterQuery = filter
      ? `&filter=${encodeURIComponent("attributedTo=" + filter)}`
      : "";

    return await axios
      .get(`${urlPrefix}/user/${user}/inbox?page=${page}${filterQuery}`, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          // eslint-disable-next-line
          Authorization: `Bearer ${token}`,
        },
      })
      .then((resp) => {
        return resp.data;
      })
      .catch(catchError);
  },
  async writeToOutbox(
    token: string,
    user: string,
    activity: Activity,
    summary?: string
  ): Promise<void> {
    if (summary) {
      activity.summary = summary;
    }
    return await axios.post(
      `${urlPrefix}/user/${user}/outbox`,
      toJSON(activity as ActivityObject),
      {
        headers: {
          "Content-Type": "application/activity+json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },
  getMedia(uri: string | undefined): string | undefined {
    if (!uri) {
      return uri;
    }

    return `${process.env.VUE_APP_BACKEND_HOST}/media/${md5(uri)}`;
  },
  // Fediverse
  async fediverseSearchUserId(query: string): Promise<string | undefined> {
    return await axios
      .get<Webfinger>(
        `https://${query.substring(
          query.indexOf("@"),
          query.length
        )}/.well-known/webfinger?resource=acct:${query}`
      )
      .then((resp) => {
        const webfinger = resp.data;
        const link = webfinger.links.find(($) => $.rel === "self");
        return link?.href;
      });
  },
  async fediverseGetActor(url: string): Promise<Actor> {
    return await axios
      .get(url, {
        headers: {
          Accept: "application/activity+json",
        },
      })
      .then((resp) => {
        return resp.data;
      });
  },
  async fediverseGetUser(url: string): Promise<InternalActor> {
    return await axios
      .get(url, {
        headers: {
          Accept: "application/activity+json",
        },
      })
      .then((resp) => resp.data);
  },
  async fediversGetCollection(url: string): Promise<OrderedCollectionPage> {
    return await axios
      .get(url, {
        headers: {
          Accept: "application/activity+json",
        },
      })
      .then((resp) => {
        return resp.data;
      });
  },
} as ApiClient;
