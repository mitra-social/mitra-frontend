import { ActivityObject, Link } from "activitypub-objects";
import { Activities } from "activitypub-objects/dst/activities/activity";
import { Activity } from "./mitra-activity";

export class Unfollow implements Activity {
  readonly to: ActivityObject | Link | URL | Array<ActivityObject | URL>;
  readonly object: ActivityObject | URL;
  readonly type = Activities.UNDO;

  constructor(
    to: ActivityObject | Link | URL | Array<ActivityObject | URL>,
    object: ActivityObject | URL
  ) {
    this.to = to;
    this.object = object;
  }
}
