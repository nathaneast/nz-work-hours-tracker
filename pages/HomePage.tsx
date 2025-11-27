import React from "react";
import type { DemoHomePageProps } from "./types";
import { TrackerPage } from "./TrackerPage";

export const HomePage: React.FC<DemoHomePageProps> = (props) => {
  return <TrackerPage mode="home" {...props} />;
};
