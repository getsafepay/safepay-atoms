import React from 'react';
import { useAppendStyles } from '../styles';
import PayerAuthentication from '../atoms/PayerAuthenticationIframe';
import { PayerAuthenticationProps } from '../atoms/PayerAuthenticationIframe/types';

export default function PayerAuthBridge(props: PayerAuthenticationProps) {
  useAppendStyles('PayerAuthentication', false);

  return <PayerAuthentication {...props} />;
}
