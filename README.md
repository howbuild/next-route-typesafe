# @howbuild/next-routes-typesafe

`Next.js`의 `link(next/link)`와 `router(next/router)`를 `type safe`하게 사용하게 해주는 library 이며 `pages`폴더를 가지고있는 모든 directory를 탐색하여 `link type`으로 추출합니다.

## Install

    yarn add @howbuild/next-routes-typesafe

## Usage

1. root에 `route.config.js` 추가
   ```js
   const config = {
     mode: 'single',
     strict: false,
   };
   ```
2. `generate-routes-type` 실행

`generate-routes-type`를 실행하고나면 root에 `router(next/router)`, `link(next/link)` type 재정의 파일(d.ts)과 page 하위에서 추출한 전체 `link type`을 저장하고 있는 type 정의 파일(d.ts)이 추가된다.

<img width="251" alt="스크린샷 2023-02-15 오전 1 52 16" src="https://user-images.githubusercontent.com/30516609/218803779-bb749c15-6a68-4219-934c-042a1814853c.png">

위 사진에서 `route.d.ts`가 page 하위에서 추출한 전체 `link type`이고, `next-router-overriding.d.ts`가 `next router,link`의 `type` 재정의 파일입니다

> route.config.js의 mode가 monorepo일때는 달라집니다.

## Config(route.config.js) option

| Name                    | Description                                                                           | Type                               |
| ----------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| [`basePath`](#basepath) | `mode`가 `monorepo`일때 사용하며 추출된 `link type`들의 key값을 제거할때 사용합니다   | `string(optional)`                 |
| `ignorePath`            | `page folder`가 있지만 `link`로 추출되길 원하지 않는 `directory`가 있을때 사용합니다. | `string[](optional)`               |
| [`strict`](#strict)     | `link`로 추출된 타입 이외에 `string`도 허용할지 여부입니다.`(default:false)`          | `boolean(optional)`                |
| [`mode`](#mode)         | project의 구조형태 입니다.`(default:single)`                                          | `'monorepo' \| 'single'(optional)` |

## basePath

`mode`가 `monorepon`일때 `link의 타입이 {[serivceName]: Links} 형태로 추출`되는데 여기서 `serviceName`의 특정 부분을 제거할때 사용합니다.

- `basePath: undefined`

  ```typescript
  'apps/auth':
        | Link<'/find-id', true>
        | Link<'/identity-verification/complete', true>
        | Link<'/identity-verification', true>
        | Link<'/invite-partners/complete', true>
        | Link<'/invite-partners', true>
        | Link<'/register-company', true>
        | Link<'/reset-password', true>
        | Link<'/settings/account', true>
        | Link<'/settings/account/withdrawal', true>
        | Link<'/signin', true>
        | Link<'/signup', true>;
  'apps/blog': Link<'/', true> | Link<'/post/[postNo]', true> | Link<'/search', true>;
  'apps/fender':
        | Link<'/demo', true>
        | Link<'/fender-pass-promotion/[passNo]/status', true>
        | Link<'/fender-pass-promotion', true>
        | Link<'/', true>
        | Link<'/sites/[fenderNo]', true>
        | Link<'/sites/[fenderNo]/modify', true>
        | Link<'/sites/[fenderNo]/status', true>
        | Link<'/sites', true>
        | Link<'/submit', true>;
  ```

- `basePath: "apps"`
  ```typescript
  'auth':
        | Link<'/find-id', true>
        | Link<'/identity-verification/complete', true>
        | Link<'/identity-verification', true>
        | Link<'/invite-partners/complete', true>
        | Link<'/invite-partners', true>
        | Link<'/register-company', true>
        | Link<'/reset-password', true>
        | Link<'/settings/account', true>
        | Link<'/settings/account/withdrawal', true>
        | Link<'/signin', true>
        | Link<'/signup', true>;
  'blog': Link<'/', true> | Link<'/post/[postNo]', true> | Link<'/search', true>;
  'fender':
        | Link<'/demo', true>
        | Link<'/fender-pass-promotion/[passNo]/status', true>
        | Link<'/fender-pass-promotion', true>
        | Link<'/', true>
        | Link<'/sites/[fenderNo]', true>
        | Link<'/sites/[fenderNo]/modify', true>
        | Link<'/sites/[fenderNo]/status', true>
        | Link<'/sites', true>
        | Link<'/submit', true>;
  ```

## strict

- `strict:true`
  - `<Link href="{link}" />`, `router.push("{link}")`에서 `{link}`값으로 오로지 추출된 `link type`만 전달할 수 있습니다.
- `strict:false`
  - `<Link href="{link}" />`, `router.push("{link}")`에서 `{link}`값으로 추출된 `link type`과 `string type`을 전달할 수 있습니다.

## mode

`monorepo`일때와 `single`일때 생성되는 파일의 위치가 달라집니다.

- `monorepo`

  - `root path`에 전체 `link type(d.ts)`파일 하나가 추가되고, ignore에 포함되지않은 Next.js의 각 project root path에 `next/link`, `next/router` type을 overriding하는 타입파일(d.ts)하나가 추가됩니다

    ```ts
    apps
      - www
        - ...
        - package.json
        - `routes-overriding.d.ts(+)`
      - partners
        - ...
        - package.json
        - `routes-overriding.d.ts(+)`
      - marketplace
        - ...
        - package.json
        - `routes-overriding.d.ts(+)`
    package.json
    `routes.d.ts(+)`
    ```

- `single`

  - `root path`에 `link type(d.ts)`, `next/link`, `next/router` type을 overriding하는 타입파일(d.ts)들이 추가됩니다.

    ```ts
    src;
    package.json`routes.d.ts(+)``next-router-overriding.d.ts(+)`;
    ```

## API

`generate함수` 모두 `parameter`로 `link type`이 기본적으로 추론이되며 `isStrict:false`일시 추론된 값 이외의 `string type`도 전달할 수 있으며 `isStrict:true`일시는 추론된 값만 사용해야합니다.
`{pathname:string, query?:{}}` 형태로 사용할 시 `pathname`값에 따라 `query`가 자동으로 추론됩니다.

| Name                                            | Description                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`generateServiceLink`](#generateservicelink)   | `mode`가 `monorepo`일때 사용하며 추출된 다른 `Next.js package`의 link를 만들때 사용합니다 |
| [`generateInternalLink`](#generateinternallink) | 현재위치의 package에 해당하는 link를 만들때 사용합니다.                                   |

## generateServiceLink

`mode`가 `monorepo`일때 사용하며 추출된 다른 `Next.js package`의 `link`를 만들때 사용합니다

<img width="535" alt="스크린샷 2023-02-15 오전 3 18 12" src="https://user-images.githubusercontent.com/30516609/218823926-0a19ceff-b2b8-4da9-997d-79a297c0c3ed.png">
<img width="553" alt="스크린샷 2023-02-15 오전 3 18 39" src="https://user-images.githubusercontent.com/30516609/218823931-e32eac4e-6b4d-41cc-b397-83658d9dcb68.png">

### Usage

```typescript
import {generateServiceLink} from '@howbuild/next-routes-typesafe';

const generateLink = generateServiceLink({www: "https://www.howbuild.com", ...})
function ReactElement() {

  return (
     //  generateLink("www", "/dashboard") = "https://www.howbuild.com/dashboard"
    <Link href={generateLink("www", "/dashboard")}>
      <div>move</div>
    </div>
  );
}
```

### API

```typescript
generateServiceLink(originMapping): (link: string | {pathname:string, query?:{}} ) => string
```

- paremeters
  - `originMapping`
    - 전체 package들의 origin 값 입니다. (ex, www:"https://www.howbuild.com", marketplace:"...", ...)
- return
  - `(link: string | {pathname:string, query?:{}} ) => string`
    - `link`
      - 추출된 `link type`이 추론되며 `{pathname:string, query?:{}}`형태로도 사용할수 있습니다(`<Link/>의 href`, `router.push()`의 `parameter type`과 동일합니다)

## generateInternalLink

현재위치의 `package`에 해당하는 `link`를 만들때 사용합니다.

  <img width="703" alt="스크린샷 2023-02-15 오전 3 06 33" src="https://user-images.githubusercontent.com/30516609/218820955-3c3e8f80-76e7-47d3-a237-c75118e8b07b.png">
  <img width="884" alt="스크린샷 2023-02-15 오전 3 05 48" src="https://user-images.githubusercontent.com/30516609/218820813-3726d3df-ce92-4d3f-b94f-c2b2f1bdbf9c.png">
  
### Usage

```typescript
import {generateInternalLink} from '@howbuild/next-routes-typesafe';
function ReactElement() {

  return (
    <Link href={generateInternalLink("/"}>
      <a>move</a>
    </div>
  );
}
```

### API

```typescript
generateInternalLink(link: string | {pathname:string, query?:{}} ): string
```

- paremeters
  - `link`
    - 추출된 `link type`이 추론되며 `{pathname:string, query?:{}}`형태로도 사용할수 있습니다(`<Link/>의 href`, `router.push()`의 `parameter type`과 동일합니다)
