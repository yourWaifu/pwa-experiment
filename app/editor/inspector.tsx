import {atom, useAtom} from "jotai";
import { FormattedMessage } from "../intl";

export const inspectorDataAtom = atom(<FormattedMessage id="inspector-empty" defineMessage="select in 2D to get info" />);

