import React from 'react';
import { Stories } from '@storybook/addon-docs';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { Loader, LoaderSize } from './';

export default {
    title: 'Loader',
    parameters: {
        docs: {
            page: (): JSX.Element => (
                <main>
                    <article>
                        <section>
                            <h1>Loader</h1>
                        </section>
                        <section>
                            <Stories includePrimary title="" />
                        </section>
                    </article>
                </main>
            ),
        },
    },
    argTypes: {
        size: {
            options: [LoaderSize.Large, LoaderSize.Medium, LoaderSize.Small],
            control: { type: 'select' },
        },
    },
} as ComponentMeta<typeof Loader>;

const Loader_Story: ComponentStory<typeof Loader> = (args) => (
    <Loader {...args} />
);

export const Default = Loader_Story.bind({});

Default.args = {
    classNames: 'my-loader-class',
};
