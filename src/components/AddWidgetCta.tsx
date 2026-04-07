import { forwardRef, type ComponentPropsWithoutRef } from 'react';
import { SecondaryButton } from './SecondaryButton';

export type AddWidgetCtaProps = Omit<ComponentPropsWithoutRef<'button'>, 'children'>;

/** Top bar: grid with Publish / Cancel (`grid-cols-2` + `sm:flex`). */
export const ADD_WIDGET_CTA_TOP_BAR_LAYOUT_CLASS =
  'col-span-2 w-full sm:col-span-1 sm:w-auto';

/**
 * Top bar “Add widget” CTA (SecondaryButton + label).
 * Forwards ref and extra button props.
 */
export const AddWidgetCta = forwardRef<HTMLButtonElement, AddWidgetCtaProps>(function AddWidgetCta(
  { type = 'button', className, ...rest },
  ref,
) {
  return (
    <SecondaryButton ref={ref} type={type} className={className} {...rest}>
      Add widget
    </SecondaryButton>
  );
});
