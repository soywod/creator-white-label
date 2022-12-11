import {BehaviorSubject} from "rxjs";
import {useObservable} from "@soywod/react-use-observable";

export const loading$ = new BehaviorSubject(false);
export const useLoading = () => useObservable(loading$, loading$.value);

export default useLoading;
