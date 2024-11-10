import { createIntl, createIntlCache, defineMessage, IntlShape } from "@formatjs/intl";
import { atom, useAtom } from "jotai";
import { text } from "./text";

const intlAtom = atom<IntlShape<any>>();

export function generateIntl(locale: string) {
  const cache = createIntlCache(); // optional but presents memory leaks
  return createIntl(
    {
      locale: locale,
      messages: text[locale],
    },
    cache
  );
}

export function FormattedMessage(data: any) {
  const [intl, setIntl] = useAtom(intlAtom);
  return <>{
    intl?.formatMessage(defineMessage(data))
  }</>
}

export { intlAtom };