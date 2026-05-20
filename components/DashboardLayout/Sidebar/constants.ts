import { IconType } from 'react-icons/lib';
import { BiBookAlt, BiMenu } from 'react-icons/bi';
import { BsFillGridFill } from 'react-icons/bs';
import { HiUsers } from 'react-icons/hi2';
import { PiChartLineFill } from 'react-icons/pi';
import { HiMiniGift } from 'react-icons/hi2';

export const LINK_ICON_STYLE = { height: '20px', width: '20px' };

export type SideBarLink = {
  icon: IconType;
  name: string;
  url: string;
};

export type SideBarLinks = SideBarLink[];

export const LINKS: SideBarLinks = [
  {
    name: 'Overview',
    url: '/dashboard',
    icon: BsFillGridFill
  }
];
