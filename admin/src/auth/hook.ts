import {BehaviorSubject} from "rxjs";
import {useObservable} from "@soywod/react-use-observable";
import notification from "antd/lib/notification";

import tokenStorage from "./token-storage";
import request from "../_shared/request";

export type AuthState = NotInitialized | NotAuthenticated | Authenticated;

type NotInitialized = {
  type: "not-initialized";
};

type NotAuthenticated = {
  type: "not-authenticated";
};

type Authenticated = {
  type: "authenticated";
  userId: number;
};

async function signIn<T>(data: T) {
  return request
    .post<{token: string; user_id: number}>("/public/sign-in", data)
    .then(res => {
      tokenStorage.set(res.token);
      auth$.next({type: "authenticated", userId: res.user_id});
    })
    .catch(err => notification.error({message: "Erreur", description: err.message}));
}

async function signOut() {
  tokenStorage.clear();
  window.location.reload();
}

// function signUp() {
//   return request.post("/sign-up");
// }

export const auth$ = new BehaviorSubject<AuthState>({type: "not-initialized"});

export const useAuth = () => {
  const [auth, setAuth] = useObservable(auth$, auth$.value);
  return {auth, setAuth, signIn, signOut};
};

request
  .get("/auth-check")
  .then(() => {
    const token = tokenStorage.get();
    if (!token) throw new Error();
    // TODO: take user id from token
    auth$.next({type: "authenticated", userId: 0});
  })
  .catch(() => auth$.next({type: "not-authenticated"}));

export default useAuth;
