# Changesets Playground

패키지별 CHANGELOG, 버전 PR, 릴리스 PR 제목, GitHub 태그를 연습하는 샘플 모노레포입니다.
모든 패키지는 private이며 npm 게시나 서비스 배포는 하지 않습니다.

## 구성

| 경로              | 패키지           | 역할                            |
| ----------------- | ---------------- | ------------------------------- |
| `apps/web`        | `@sample/web`    | 공유 UI를 사용하는 작은 Node 앱 |
| `packages/ui`     | `@sample/ui`     | 버튼 객체를 만드는 공통 UI      |
| `packages/config` | `@sample/config` | 앱·UI 테스트의 공통 개발 설정   |

`web → ui`는 런타임 의존성이고 `web/ui → config`는 개발 의존성입니다.
세 패키지는 `0.0.0`에서 시작하며 각각 버전과 CHANGELOG를 갖습니다.

## 실행

Node.js 20 이상과 pnpm 10을 사용합니다.

```bash
pnpm install
pnpm test
pnpm demo
```

## 먼저 해볼 실습

`codex/example-ui-minor` 브랜치에는 버튼에 `variant`를 추가하는 예제와 minor changeset이 있습니다.
해당 브랜치의 기능 PR부터 시작하면 전체 흐름을 직접 확인할 수 있습니다.

1. 기능 PR의 코드와 `.changeset/button-variant.md`를 확인하고 **develop에 병합**합니다.
2. GitHub Actions가 `changeset-release/develop` → `develop`의 **chore: version packages** PR을 생성합니다.
3. 버전 PR에서 다음을 확인합니다.
   - `@sample/ui`: `0.0.0` → `0.1.0`과 CHANGELOG 생성
   - `@sample/web`: `0.0.0` → `0.0.1`과 의존성 업데이트 CHANGELOG 생성
   - `@sample/config`: `0.0.0` 유지
   - `.changeset/button-variant.md` 소비 후 삭제
4. 버전 PR의 QA 통과를 확인하고 **develop에 병합**합니다.
5. **develop → main PR**을 엽니다. 제목이 다음과 같이 자동 작성됩니다.

```text
release: @sample/ui@0.1.0, @sample/web@0.0.1
```

6. QA와 **Release PR Metadata**가 통과하면 **Create a merge commit**으로 병합합니다.
7. `main` QA 후 GitHub Tags에 다음 태그가 생기는지 확인합니다.

```text
@sample/ui@0.1.0
@sample/web@0.0.1
```

태그는 버전을 준비한 develop 커밋이 아니라 **develop → main 병합 커밋**을 가리킵니다.
`0.0.0`인 config에는 태그가 생성되지 않습니다.
마지막으로 `main` → `develop` 역병합 PR을 병합해 브랜치 이력을 동기화합니다.

## 직접 기능 PR 만들기

```bash
git switch develop
git pull --ff-only
git switch -c feature/my-change

# 코드를 수정한 뒤
pnpm changeset
pnpm changeset status --verbose
pnpm test

git add .
git commit -m "feat: 예제 기능 추가"
git push -u origin feature/my-change
```

GitHub에서 `feature/my-change` → `develop` PR을 엽니다.
changeset 선택은 **패키지 선택 → major 대상 선택 → minor 대상 선택 → 나머지는 patch** 순서입니다.
방향키로 이동하고 Space로 선택하며 Enter로 확인합니다.

| 종류  | 예시                               |
| ----- | ---------------------------------- |
| patch | 버튼 문구 오류 수정                |
| minor | 호환되는 버튼 옵션 추가            |
| major | 기존 함수 인자 삭제·반환 타입 변경 |

changeset은 기능 코드와 함께 커밋합니다. 기능 개발자가 직접 버전을 수정할 필요는 없습니다.
문서·도구 설정처럼 릴리스에 영향이 없는 변경은 생략하고 PR에 사유를 적습니다.

## 추가 실험

- config만 patch로 올리면 개발 의존성인 web·ui의 버전은 자동 증가하지 않습니다.
- 같은 패키지의 patch와 minor changeset이 쌓이면 더 큰 증가 종류인 minor로 합쳐집니다.
- 버전 PR을 병합하기 전에 main PR을 열면 미소비 changeset 때문에 준비 검사가 실패합니다.
- 버전 PR을 병합한 뒤 새 changeset을 추가하면 새 버전 PR을 먼저 병합해야 합니다.
- 문서만 바뀌고 버전 변경이 없으면 main PR 제목은 `chore: sync develop to main`입니다.

## GitHub 자동화

- develop push + QA 통과: 버전 PR 생성·갱신
- main PR: 출발 브랜치, 미소비 changeset, CHANGELOG 검사 및 제목 갱신
- main push + QA 통과: annotated tag 생성·push
- 저장소 병합 방식: merge commit만 허용

현재 비공개 저장소의 요금제에서는 ruleset을 활성화할 수 없습니다.
CI 검사와 PR 제목 갱신은 동작하지만, 검사 실패 시 병합을 강제로 막는 기능은 적용되지 않습니다.
샘플 실습에서는 QA와 Release PR Metadata의 통과를 직접 확인한 뒤 병합해주세요.
GitHub Pro 또는 ruleset을 사용할 수 있는 저장소에서는
`.github/main-release-ruleset.json`을 적용해 두 검사와 최신 브랜치를 필수 조건으로 설정할 수 있습니다.

별도 PAT 없이 기본 `GITHUB_TOKEN`을 사용합니다.
GitHub Settings → Actions → General에서 **Allow GitHub Actions to create and approve pull requests**가 켜져 있어야 합니다.
자동 생성한 버전 PR의 QA는 `workflow_dispatch`로 명시적으로 실행합니다.

자동 실행이 시작되지 않거나 실패 후 재시도하려면 **Actions → CI & Releases → Run workflow**를 사용합니다.

| Branch                    | task            | 동작                                    |
| ------------------------- | --------------- | --------------------------------------- |
| develop                   | prepare-version | QA 통과 후 버전 PR 생성·갱신            |
| changeset-release/develop | check           | 버전 PR의 QA만 실행                     |
| main                      | tag-release     | QA와 릴리스 준비 검사 통과 후 태그 생성 |

기본 task인 `check`는 QA만 수행합니다. 버전 준비와 태그 작업은 지정한 브랜치에서만 실행됩니다.

원본 코드와 현재 저장소의 설정을 함께 살펴볼 위치:

- [.changeset/config.json](.changeset/config.json)
- [CI와 버전·태그 워크플로](.github/workflows/ci.yml)
- [릴리스 PR 제목·준비 검사](.github/workflows/release-pr.yml)
- [main 규칙 정의](.github/main-release-ruleset.json)
- [실제 버전 비교](scripts/release-pr.mjs)
- [태그 생성](scripts/tag-packages.mjs)
