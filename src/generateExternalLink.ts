/**
 * ! warning 해당 함수대신 "a" tag 사용을 권장하며 반드시 next link, router써야할경우에만 사용
 * nextjs의 route관련 (link, router의 타입에 상수를 쓸때 사용하는 함수) 함수들을 사용할때
 * generated된 type이외의 url을 입력해야할때 사용(단순 타입변환)
 * @example
 * 스크립트 실행후에는 next/link, next/router에 들어올수있는 값들이 제한되는데 이러한 상황에서는 새로운 url
 * 을 사용할 수가 없음.
 * 위와같은 상황에서 새로운 url을 사용해야할때 사용
 * <Link href={generateExternalLink("https://www.howbuild.com")}><a>link</a></Link>
 */
export const generateExternalLink = (url: string) => {
  return url;
};
