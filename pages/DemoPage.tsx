import React from "react";
import type { DemoHomePageProps } from "./types";
import { TrackerPage } from "./TrackerPage";

export const DemoPage: React.FC<DemoHomePageProps> = (props) => {
  return <TrackerPage mode="demo" {...props} />;
};
