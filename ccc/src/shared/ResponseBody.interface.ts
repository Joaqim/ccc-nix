import type { Player } from "./Player.interface";

export interface ResponseBody {
  message: string;
  players?: Player[];
}
