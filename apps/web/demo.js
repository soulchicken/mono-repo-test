import { link } from '@sample/ui/link'
import { home } from './index.js'

const page = {
  ...home(),
  documentation: link('실습 안내', 'https://github.com/soulchicken/mono-repo-test#readme'),
}

console.log(JSON.stringify(page, null, 2))
