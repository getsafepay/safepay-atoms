import React from 'react';
import CardCapture, { CardCaptureProps } from '../atoms/CardCaptureIframe';
import { useAppendStyles } from '../styles';

export default function CardAtomBridge(props: CardCaptureProps) {
  useAppendStyles('CardAtom', false);

  return <CardCapture {...props} />;
}
