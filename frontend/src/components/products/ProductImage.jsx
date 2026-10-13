import React, { useEffect, useState } from 'react';
import Icon from '../ui/Icon';

export default function ProductImage({ product, className = '' }) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [product.image]);
  return product.image && !broken
    ? <img className={className} src={product.image} alt={product.name} loading="lazy" decoding="async" width="320" height="250" onError={() => setBroken(true)} />
    : <div className={`image-placeholder ${className}`} role="img" aria-label={product.name}><Icon name="box" size={54} /><span>{product.name}</span></div>;
}
