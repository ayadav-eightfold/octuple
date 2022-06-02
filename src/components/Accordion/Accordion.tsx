import React, {
    FC,
    Ref,
    useCallback,
    useState,
    useRef,
    useEffect,
} from 'react';

import { mergeClasses, uniqueId } from '../../shared/utilities';

import { AccordionProps, AccordionSummaryProps, AccordionBodyProps } from './';
import { Icon, IconName } from '../Icon';
import { eventKeys } from '../../shared/eventKeys';
import { createEaseAnimations } from '../../hooks/useAnimation';

import styles from './accordion.module.scss';

export const AccordionSummary: FC<AccordionSummaryProps> = React.forwardRef(
    (
        {
            children,
            expandIconProps,
            expanded,
            onClick,
            classNames,
            id,
            ...rest
        },
        ref: Ref<HTMLDivElement>
    ) => {
        const headerClassnames = mergeClasses([
            styles.accordionSummary,
            classNames,
        ]);

        const iconStyles: string = mergeClasses([
            styles.accordionIcon,
            // Conditional classes can also be handled as follows
            { [styles.expandedIcon]: expanded },
        ]);

        // to handle enter press on accordion header
        const handleKeyDown = useCallback(
            (event) => {
                event.key === eventKeys.ENTER && onClick?.(event);
            },
            [onClick]
        );

        return (
            <div
                aria-expanded={expanded}
                aria-controls={`${id}-content`}
                className={headerClassnames}
                onClick={onClick}
                onKeyDown={handleKeyDown}
                id={`${id}-header`}
                role="button"
                tabIndex={0}
                ref={ref}
                {...rest}
            >
                {children}
                <Icon classNames={iconStyles} {...expandIconProps} />
            </div>
        );
    }
);

export const AccordionBody: FC<AccordionBodyProps> = React.forwardRef(
    (
        { children, expanded, classNames, id, ...rest },
        ref: Ref<HTMLDivElement>
    ) => {
        const accordionBodyContainerStyles: string = mergeClasses(
            styles.accordionBodyContainer
        );

        const accordionBodyStyles: string = mergeClasses(
            styles.accordionBody,
            classNames
        );

        return (
            <div
                aria-labelledby={`${id}-header`}
                className={accordionBodyContainerStyles}
                id={`${id}-content`}
                role="region"
                ref={ref}
                {...rest}
            >
                <div className={accordionBodyStyles}>{children}</div>
            </div>
        );
    }
);

export const Accordion: FC<AccordionProps> = React.forwardRef(
    (
        {
            expanded = false,
            onAccordionChange,
            classNames,
            summary,
            expandIconProps = { path: IconName.mdiChevronDown },
            children,
            id = uniqueId('accordion-'),
            headerProps = {},
            bodyProps = {},
            ...rest
        },
        ref: Ref<HTMLDivElement>
    ) => {
        const [isExpanded, setIsExpanded] = useState<boolean>(expanded);
        let collapsed = { x: 0, y: 0 };
        const headerRef: Ref<HTMLDivElement> = useRef(null);
        const contentRef: Ref<HTMLDivElement> = useRef(null);
        const [accordionStyle, setAccordionStyle] = useState({});
        const [contentStyle, setContentStyle] = useState({});

        useEffect(() => {
            calculateScales();
        }, []);

        useEffect(() => {
            if (isExpanded) {
                expand();
            } else {
                collapse();
            }
        }, [isExpanded]);

        const collapse = useCallback(() => {
            const { x, y } = collapsed;
            const invX = 1 / x;
            const invY = 1 / y;
            setAccordionStyle({
                transform: `scale(${x}, ${y})`,
            });
            setContentStyle({
                transform: `scale(${invX}, ${invY})`,
            });
        }, []);

        const expand = useCallback(() => {
            setAccordionStyle({
                transform: `scale(1, 1)`,
            });
            setContentStyle({
                transform: `scale(1, 1)`,
            });
        }, []);

        const toggleAccordion = useCallback((expand: boolean): void => {
            setIsExpanded(expand);
            onAccordionChange?.(expand);
        }, []);

        useEffect(() => {
            calculateScales();
        }, []);

        const calculateScales = useCallback(() => {
            const header =
                'current' in headerRef &&
                headerRef.current.getBoundingClientRect();
            const content =
                'current' in ref && ref.current.getBoundingClientRect();
            const value = {
                x: header.width / content.width,
                y: header.height / content.height,
            };
            createEaseAnimations(value, { x: 1, y: 1 }, `expand${id}`);
            createEaseAnimations({ x: 1, y: 1 }, value, `collapse${id}`);
            collapsed = value;
        }, []);

        const accordionBodyClasses = mergeClasses([styles.main]);

        const accordionContainerStyle: string = mergeClasses(
            styles.accordion,
            classNames,
            { [styles.accordionExpanded]: isExpanded }
        );

        return (
            <div className={styles.accordionWrapper}>
                <div
                    className={accordionContainerStyle}
                    ref={ref}
                    {...rest}
                    style={{
                        ...accordionStyle,
                        ...rest.style,
                        animationName: isExpanded
                            ? `expand${id}Animation`
                            : `collapse${id}Animation`,
                    }}
                >
                    <div
                        className={accordionBodyClasses}
                        style={{
                            ...contentStyle,
                            animationName: isExpanded
                                ? `expand${id}ContentsAnimation`
                                : `collapse${id}ContentsAnimation`,
                        }}
                    >
                        <AccordionSummary
                            expandIconProps={expandIconProps}
                            onClick={() => {
                                toggleAccordion(!isExpanded);
                            }}
                            expanded={isExpanded}
                            id={id}
                            ref={headerRef}
                            {...headerProps}
                        >
                            {summary}
                        </AccordionSummary>

                        <AccordionBody
                            ref={contentRef}
                            id={id}
                            expanded={isExpanded}
                            {...bodyProps}
                        >
                            {children}
                        </AccordionBody>
                    </div>
                </div>
            </div>
        );
    }
);
