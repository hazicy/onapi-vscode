export type DomainInfoProps = {
  inputDomain: string;
  cookieText: string;
  cookieObj: any;
  activeId: null | string;
  isShowArea: string;
  activeItem: any;
};

export interface ICookie {
  // Cookie unique identifier ID, guid format
  cookie_id: string;

  // Cookie domain
  domain: string;

  // Cookie name
  key: string;

  // Cookie validity duration
  maxAge: string;

  // Cookie expiration time
  expires: Date | string;

  // Storage path
  path: string;

  // Project ID it belongs to
  project_id?: string;

  // Cookie value
  value: string | any;

  activeId?: string;

  name?: any;
}
