import React, {FC, useState, useContext, createContext} from "react";

type AsyncContext = [boolean, React.Dispatch<React.SetStateAction<boolean>>];

const context = createContext<AsyncContext>([false, () => {}]);

export const AsyncContextProvider: FC = props => {
  const state = useState(false);
  return <context.Provider value={state}>{props.children}</context.Provider>;
};

export function useAsyncContext(): AsyncContext {
  return useContext(context);
}

export function useAsync(): boolean {
  return useContext(context)[0];
}
