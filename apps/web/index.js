import { button } from '@sample/ui'

export function home(title = 'Changesets Playground') {
  return { title, action: button('시작하기') }
}
