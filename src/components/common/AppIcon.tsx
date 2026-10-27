import React from 'react';
import { IconName, MODAWWAN_ICONS } from './iconsMap';

export interface AppIconProps extends React.SVGProps<SVGSVGElement> {
  name: IconName;
  size?: number;
  color?: string;
  className?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({ name, size = 18, color = 'currentColor', className = '', style, ...rest }) => {
  const Icon = MODAWWAN_ICONS[name];
  return <Icon size={size} color={color} weight={name.endsWith('Solid') ? 'fill' : 'regular'}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    className={`app-icon app-icon-${name} ${className}`} aria-hidden="true" {...rest} />;
};
export default AppIcon;