import { createIntl, createIntlCache, defineMessage, IntlShape } from "@formatjs/intl";
import { atom, useAtom } from "jotai";

const intlAtom = atom<IntlShape<any>>();

export function generateIntl(locale: string) {
  const cache = createIntlCache(); // optional but presents memory leaks
  return createIntl(
    {
      locale: locale,
      messages: ({
        'en-US': {
          'menu-text': 'Menu',
        },
        "zh-Hans": {
          "menu-text": "主菜单"
        },
        "zh-Hant": {
          "menu-text": "主選單"
        }
      })[locale],
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