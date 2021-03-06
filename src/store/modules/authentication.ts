import { Action, Module, Mutation, VuexModule } from "vuex-module-decorators";

import client from "apiClient";
import { Credential } from "@/model/credential";
import { CreateUser } from "@/model/create-user";
import router from "@/router";
import { AuthenticationUtil } from "@/utils/authentication-util";

@Module({ namespaced: true })
class Authentication extends VuexModule {
  public hasLoadedOnce = false;
  public status = 0;

  get authStatus(): number {
    return this.status;
  }

  @Mutation
  public setStatus(state: number): void {
    this.status = state;
  }

  @Mutation
  public loginSuccess(): void {
    this.status = 200;
    this.hasLoadedOnce = true;
  }

  @Mutation
  public loginError(code: number): void {
    this.status = code;
    this.hasLoadedOnce = false;
  }

  @Action
  public async login(credential: Credential): Promise<void> {
    this.context.commit("setStatus", 0);

    return await client
      .login(credential)
      .then((token: string) => {
        AuthenticationUtil.setAuth(credential.username, token);
        this.context.commit("loginSuccess");
        router.push("/");
      })
      .catch(() => {
        this.context.commit("loginError", 401);
      });
  }

  @Action({ rawError: true })
  public async createUser(user: CreateUser): Promise<void> {
    return await client.createUser(user).then(() =>
      this.context.dispatch(
        "Notify/success",
        "You successfully signed up as a new user.",
        {
          root: true,
        }
      )
    );
  }
}
export default Authentication;
