import { createContext, useContext } from "react";

type DrawerCtx = { open: () => void };
export const DrawerContext = createContext<DrawerCtx>({ open: () => {} });
export const useDrawer = () => useContext(DrawerContext);
