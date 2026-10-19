# Changesets

루트에서 `pnpm changeset`을 실행하고 변경 패키지와 버전 종류를 선택합니다.
생성된 Markdown을 기능 코드와 함께 커밋합니다.

버전 PR은 `develop` 대상으로 자동 생성됩니다. 버전 PR을 병합한 뒤
`develop` → `main` 릴리스 PR을 merge commit으로 병합하면 태그가 생성됩니다.

자세한 실습 순서는 [루트 README](../README.md)를 참고하세요.
