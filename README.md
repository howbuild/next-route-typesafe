# next-route-typesafe

`next/link`, `next/router`를 `type safe`하게 사용하게 해주는 library 이며 `pages`폴더를 가지고있는 모든 directory를 탐색하여 `link type`으로 추출합니다.

<img width="460" alt="스크린샷 2023-02-19 오후 6 33 29" src="https://user-images.githubusercontent.com/30516609/219940237-43a1c641-89bb-4e2d-ac0d-ce1c513785ee.png">

## Install

    yarn add next-route-typesafe

## Usage

1. root에 `route.config.js` 추가
   ```js
   const config = {
     mode: 'single',
     strict: false,
   };
   ```
2. `generate-routes-type` 실행

`generate-routes-type`를 실행하고나면 root에 `next/router`, `next/link`의 `type` 재정의 파일(`next-routes-overriding.d.ts`)과 page 하위에서 추출한 전체 `link type`을 저장하고 있는 type 정의 파일(`routes.d.ts`)이 하나씩 추가됩니다.

<img width="251" alt="스크린샷 2023-02-15 오전 1 52 16" src="https://user-images.githubusercontent.com/30516609/218803779-bb749c15-6a68-4219-934c-042a1814853c.png">

위 사진에서 `route.d.ts`가 page 하위에서 추출한 전체 `link type`이고, `next-router-overriding.d.ts`가 `next/router`, `next/link`의 `type` 재정의 파일입니다

> route.config.js의 [`mode`](#mode)가 monorepo일때는 달라집니다.

## Config(route.config.js) option

| Name                    | Description                                                                            | Type                               |
| ----------------------- | -------------------------------------------------------------------------------------- | ---------------------------------- |
| [`basePath`](#basepath) | `mode`가 `monorepo`일때 사용하며 추출된 `link type`들의 key값을 제거할때 사용합니다    | `string(optional)`                 |
| `ignorePath`            | `pages folder`가 있지만 `link`로 추출되길 원하지 않는 `directory`가 있을때 사용합니다. | `string[](optional)`               |
| [`strict`](#strict)     | `link`로 추출된 타입 이외에 `string`도 허용할지 여부입니다.`(default:false)`           | `boolean(optional)`                |
| [`mode`](#mode)         | project의 구조형태 입니다.                                                             | `'monorepo' \| 'single'(required)` |

## basePath

`mode`가 `monorepon`일때 `link의 타입이 {[serivceName]: Links} 형태로 추출`되는데 여기서 `serviceName`의 특정 부분을 제거할때 사용합니다.

- `basePath: undefined`

  ```typescript
  'apps/serviceA':
        | Link<'/a', true>
        | Link<'/b', true>
        | Link<'/a/[query]', true>
  'apps/serviceB': Link<'/', true> | Link<'/post/[postNo]', true> | Link<'/search', true>;
  'apps/serviceC':
        | Link<'/demo', true>
        | Link<'/', true>
        | Link<'/submit', true>;
  ```

- `basePath: "apps"`
  ```typescript
  'serviceA':
        | Link<'/a', true>
        | Link<'/b', true>
        | Link<'/a/[query]', true>
  'serviceB': Link<'/', true> | Link<'/post/[postNo]', true> | Link<'/search', true>;
  'serviceC':
        | Link<'/demo', true>
        | Link<'/', true>
        | Link<'/submit', true>;
  ```

## strict

`link type`으로 `string`을 허용할지 여부를 결정하는 option 입니다.

- `strict:true`
  - `Link component href prop`에 오로지 추출된 `link type`만 전달할 수 있습니다.
    - `<Link href="string" />` 형태로 사용시 `path param`이 없는 path만 전달할 수 있습니다
      - `<Link href="/a/b" />`(✅ correct)
      - `<Link href="/a/[b]" />`(❌ error)
    - `<Link href={{pathname:"string", query:{...}}} />` 형태로 사용시 `pathname`에 `path param`여부에 따라 `query`값의 필수 여부가 결정되고, `path param`이외의 값을 `query`에 전달할시 모두 `query string` 으로 바뀝니다.
      - `<Link href={{pathname:"/a/b"}} />`(✅ correct)
      - `<Link href={{pathname:"/a/b", query:{qs:22} }} />`(✅ correct)
      - `<Link href={{pathname:"/a/[b], query:{b:"required", token:"it is query string" }}} />`(✅ correct)
      - `<Link href={{pathname:"/a/[b]}} />`(❌ error `query`에 b값을 필수로 전달 해줘야 합니다)
- `strict:false`
  - `Link component href prop`에 추출된 `link type`과 `string type`모두를 전달할 수 있습니다
    - `<Link href={{pathname:"/a/b"}} />`(✅ correct)
    - `<Link href={{pathname:"/a/[b]"}} />`(✅ correct)
    - `<Link href="/a/b" />`(✅ correct)
    - `<Link href="/a/[b]" />`(✅ correct)
    - `<Link href={44} />`(❌ error)

> `next/link`, `next/router`, [`generateLinkapi`](#api)에서도 똑같은 `rule`이 적용됩니다.

## mode

`monorepo`일때와 `single`일때 생성되는 파일의 위치가 달라집니다.

### monorepo

프로젝트 구조가 다음과 같을때

```ts
  apps
    - serviveA
      - ...
      - pages
        - a
          - c
            - [userId]
        - b
          - [token]
        - ...
      - package.json
    - serviceB
      - ...
      - pages
        - ....
      - package.json
  package.json
  ...
```

타입은 다음과같이 만들어집니다.(`Link type`의 두번째 `Generic`은 [`strict option`](#strict))

```ts
  serviceA:
    | Link<'/', false>
    | Link<'/a', false>
    | Link<'/a/c', false>
    | Link<'/a/c/[userId]', false>
    | Link<'/b/[token]', false>;
  serviceB:
    | Link<'/', false>
    | ...
```

type이 만들어 지는 위치는 `root`에 전체 `link type(route.d.ts)`파일 하나가 추가되고, ignore에 포함되지않은 `Next.js의 각 root`에 `next/link`, `next/router`의 `type`을 overriding하는 타입파일(`routes-overriding.d.ts`)하나가 추가됩니다

    ```ts
    apps
      - serviceA
        - ...
        - package.json
        - `routes-overriding.d.ts(+)`
      - serviceB
        - ...
        - package.json
        - `routes-overriding.d.ts(+)`
    package.json
    `routes.d.ts(+)`
    ```

### single

프로젝트 구조가 다음과 같을때

```ts
  src
    - pages
      - a
        - c
          - [userId]
      - b
        - [token]
      - ...
  package.json
  ...
```

타입은 다음과같이 만들어집니다.(`Link type`의 두번째 `Generic`은 [`strict option`](#strict))

```ts
  type LinkType =
    | Link<'/', false>
    | Link<'/a', false>
    | Link<'/a/c', false>
    | Link<'/a/c/[userId]', false>
    | Link<'/b/[token]', false>
    | ...
```

root에 `link type(routes.d.ts)`과 `next/link`, `next/router`의 `type`을 overriding하는 타입파일(`next-router-overriding.d.t`)들이 추가됩니다.

    ```ts
    - ...
    - package.json
    - `routes.d.ts(+)`
    - `next-router-overriding.d.ts(+)`
    ```

## API

link를 만들어주는 함수이며 `generate함수` 모두 `parameter`로 `link type`이 기본적으로 추론이고 `strict` 값에 따라 type이 달라집니다

- `isStrict:false`
  - 추론된 값 이외의 `string type`도 전달할 수 있습니다
- `isStrict:true`
  - 추론된 값만 사용이 가능하며 `path param([id]의 형태]`가 있을시에는 `{pathname:string, query:{}}` 의 형태로만 사용해야 합니다

| Name                                            | Description                                                                               |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`generateServiceLink`](#generateservicelink)   | `mode`가 `monorepo`일때 사용하며 추출된 다른 `Next.js package`의 link를 만들때 사용합니다 |
| [`generateInternalLink`](#generateinternallink) | 현재위치의 package에 해당하는 link를 만들때 사용합니다.                                   |

## generateServiceLink

`mode`가 `monorepo`일때 사용하며 추출된 다른 `Next.js package`의 `link`를 만들때 사용합니다

### Usage

```typescript
import {generateServiceLink} from 'next-route-typesafe';

const generateLink = generateServiceLink({serviceA: "https://www.serviceA.com", ...})
function ReactElement() {

  return (
     // generateLink("serviceA", "/a") = "https://www.serviceA.com/a/test?qa=55"
    <Link href={generateLink("serviceA", {pathname:"/a/[id]", query:{id:"test", qs:55}})}>
      <div>move</div>
    </div>
  );
}
```

### API

```typescript
generateServiceLink(originMapping): (link: string | {pathname:string, query?:{}} ) => string
```

- parameters
  - `originMapping`
    - 전체 package들의 origin 값 입니다. (ex, {serviceA:"https://www.serviceA.com", serviceB:"https..." ...})
- return
  - `(link: string | {pathname:string, query?:{}} ) => string`
    - `link`
      - 추출된 `link type`이 추론되며 `{pathname:string, query?:{}}`형태로도 사용할수 있습니다(`<Link/>의 href`, `router.push()`의 `parameter type`과 동일합니다)

## generateInternalLink

현재위치의 `package`에 해당하는 `link`를 만들때 사용합니다.

### Usage

```typescript
import {generateInternalLink} from 'next-route-typesafe';
function ReactElement() {

  return (
    // generateInternalLink({pathname:"/a/[id]", query: {id:22}}) = "/a/22
    <Link href={generateInternalLink({pathname:"/a/[id]", query: {id:22}})}>
      <a>move</a>
    </div>
  );
}
```

### API

```typescript
generateInternalLink(link: string | {pathname:string, query?:{}} ): string
```

- parameters
  - `link`
    - 추출된 `link type`이 추론되며 `{pathname:string, query?:{}}`형태로도 사용할수 있습니다(`<Link/>의 href`, `router.push()`의 `parameter type`과 동일합니다)
