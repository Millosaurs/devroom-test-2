"use client";

import {
  AuctionOwnerControls,
  AuctionOwnerControlsProps,
} from "./auction-owner-controls";

export default function AuctionOwnerControlsWrapper(
  props: AuctionOwnerControlsProps
) {
  return <AuctionOwnerControls {...props} />;
}
