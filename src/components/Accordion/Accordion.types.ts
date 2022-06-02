import { OcBaseProps } from '../OcBase';
import { IconProps } from '../Icon';
import { Ref } from 'react';

interface AccordionBaseProps extends OcBaseProps<HTMLSpanElement> {
    /**
     * Accordion is in an expanded state or not
     * @default false
     */
    expanded?: boolean;
    /**
     * Expand icon props
     * @default { path: IconName['mdiChevronDown'] }
     */
    expandIconProps?: IconProps;
    ref?: Ref<HTMLDivElement>;
}

export interface AccordionProps extends AccordionBaseProps {
    /**
     * Callback called when the expanded state of the accordion changes
     */
    onAccordionChange?: (expanded: boolean) => void;
    /**
     * Accordion Summary
     */
    summary: React.ReactNode | string;
    /**
     * Accordion Header Props
     */
    headerProps?: AccordionSummaryProps;
    /**
     * Accordion Body Props
     */
    bodyProps?: AccordionBodyProps;
}

export interface AccordionSummaryProps extends AccordionBaseProps {}

export interface AccordionBodyProps extends AccordionBaseProps {}
