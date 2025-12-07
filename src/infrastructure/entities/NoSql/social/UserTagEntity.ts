import { z } from "zod";
import TagEntity from "./TagEntity";

const UserTagEntity = z.record(TagEntity, z.number());

export default UserTagEntity;
