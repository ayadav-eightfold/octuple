import React from 'react';
import { act } from 'react-dom/test-utils';
import type { ReactWrapper } from 'enzyme';
import Enzyme, { mount } from 'enzyme';
import Adapter from '@wojtekmaj/enzyme-adapter-react-17';
import OcForm, { OcField, OcList } from '../';
import type {
    OcFormInstance,
    OcFormProps,
    OcListField,
    OcListOperations,
    OcListProps,
    OcMeta,
} from '../OcForm.types';
import OcListContext from '../OcListContext';
import { Input } from './Common/InfoField';
import { changeValue, getField } from './Common';
import timeout from './Common/timeout';

Enzyme.configure({ adapter: new Adapter() });

describe('OcForm.OcList', () => {
    let form: OcFormInstance<any>;

    function generateForm(
        renderList?: (
            fields: OcListField[],
            operations: OcListOperations,
            meta: OcMeta
        ) => JSX.Element | React.ReactNode,
        formProps?: OcFormProps,
        listProps?: Partial<OcListProps>
    ): [ReactWrapper, () => ReactWrapper] {
        const wrapper = mount(
            <div>
                <OcForm
                    ref={(instance) => {
                        form = instance;
                    }}
                    {...formProps}
                >
                    <OcList name="list" {...listProps}>
                        {renderList}
                    </OcList>
                </OcForm>
            </div>
        );

        return [wrapper, () => getField(wrapper).find('div')];
    }

    test('basic', async () => {
        const [, getList] = generateForm(
            (fields) => (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                </div>
            ),
            {
                initialValues: {
                    list: ['', '', ''],
                },
            }
        );

        function matchKey(index: number, key: string) {
            expect(getList().find(OcField).at(index).key()).toEqual(key);
        }

        matchKey(0, '0');
        matchKey(1, '1');
        matchKey(2, '2');

        const listNode = getList();

        await changeValue(getField(listNode, 0), '111');
        await changeValue(getField(listNode, 1), '222');
        await changeValue(getField(listNode, 2), '333');

        expect(form.getFieldListValues()).toEqual({
            list: ['111', '222', '333'],
        });
    });

    test('not crash', () => {
        // Empty only
        mount(
            <OcForm initialValues={{ list: null }}>
                <OcForm.OcList name="list">{() => null}</OcForm.OcList>
            </OcForm>
        );
        mount(
            <OcForm initialValues={{ list: {} }}>
                <OcForm.OcList name="list">{() => null}</OcForm.OcList>
            </OcForm>
        );
    });

    test('operation', async () => {
        let operation: OcListOperations;
        const [wrapper, getList] = generateForm((fields, opt) => {
            operation = opt;
            return (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                </div>
            );
        });

        function matchKey(index: number, key: string) {
            expect(getList().find(OcField).at(index).key()).toEqual(key);
        }

        // Add
        act(() => {
            operation.add();
        });
        // Add default value
        act(() => {
            operation.add('2');
        });

        act(() => {
            operation.add();
        });

        wrapper.update();
        expect(getList().find(OcField).length).toEqual(3);
        expect(form.getFieldListValues()).toEqual({
            list: [undefined, '2', undefined],
        });

        matchKey(0, '0');
        matchKey(1, '1');
        matchKey(2, '2');

        // Move
        act(() => {
            operation.move(2, 0);
        });
        wrapper.update();
        matchKey(0, '2');
        matchKey(1, '0');
        matchKey(2, '1');

        // noneffective move
        act(() => {
            operation.move(-1, 0);
        });
        wrapper.update();
        matchKey(0, '2');
        matchKey(1, '0');
        matchKey(2, '1');

        // noneffective move
        act(() => {
            operation.move(0, 10);
        });

        wrapper.update();
        matchKey(0, '2');
        matchKey(1, '0');
        matchKey(2, '1');

        // noneffective move
        act(() => {
            operation.move(-1, 10);
        });

        wrapper.update();
        matchKey(0, '2');
        matchKey(1, '0');
        matchKey(2, '1');

        // noneffective move
        act(() => {
            operation.move(0, 0);
        });
        wrapper.update();
        matchKey(0, '2');
        matchKey(1, '0');
        matchKey(2, '1');

        // Revert Move
        act(() => {
            operation.move(0, 2);
        });
        wrapper.update();
        matchKey(0, '0');
        matchKey(1, '1');
        matchKey(2, '2');

        // Modify
        await changeValue(getField(getList(), 1), '222');
        expect(form.getFieldListValues()).toEqual({
            list: [undefined, '222', undefined],
        });
        expect(form.isTouched(['list', 0])).toBeFalsy();
        expect(form.isTouched(['list', 1])).toBeTruthy();
        expect(form.isTouched(['list', 2])).toBeFalsy();

        matchKey(0, '0');
        matchKey(1, '1');
        matchKey(2, '2');

        // Remove
        act(() => {
            operation.remove(1);
        });
        wrapper.update();
        expect(getList().find(OcField).length).toEqual(2);
        expect(form.getFieldListValues()).toEqual({
            list: [undefined, undefined],
        });
        expect(form.isTouched(['list', 0])).toBeFalsy();
        expect(form.isTouched(['list', 2])).toBeFalsy();

        matchKey(0, '0');
        matchKey(1, '2');

        // Remove not exist: less
        act(() => {
            operation.remove(-1);
        });
        wrapper.update();

        matchKey(0, '0');
        matchKey(1, '2');

        // Remove not exist: more
        act(() => {
            operation.remove(99);
        });
        wrapper.update();

        matchKey(0, '0');
        matchKey(1, '2');
    });

    test('remove when the param is Array', () => {
        let operation: OcListOperations;
        const [wrapper, getList] = generateForm((fields, opt) => {
            operation = opt;
            return (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                </div>
            );
        });

        function matchKey(index: number, key: string) {
            expect(getList().find(OcField).at(index).key()).toEqual(key);
        }

        act(() => {
            operation.add();
        });

        act(() => {
            operation.add();
        });

        wrapper.update();
        expect(getList().find(OcField).length).toEqual(2);

        // remove empty array
        act(() => {
            operation.remove([]);
        });

        wrapper.update();

        matchKey(0, '0');
        matchKey(1, '1');

        // remove not esist element in array
        act(() => {
            operation.remove([-1, 99]);
        });
        wrapper.update();

        matchKey(0, '0');
        matchKey(1, '1');

        act(() => {
            operation.remove([0]);
        });

        wrapper.update();
        expect(getList().find(OcField).length).toEqual(1);
        matchKey(0, '1');

        act(() => {
            operation.add();
        });

        act(() => {
            operation.add();
        });

        wrapper.update();
        matchKey(0, '1');
        matchKey(1, '2');
        matchKey(2, '3');

        act(() => {
            operation.remove([0, 1]);
        });

        wrapper.update();
        matchKey(0, '3');
    });

    test('add when the second param is number', () => {
        let operation: OcListOperations;
        const [wrapper, getList] = generateForm((fields, opt) => {
            operation = opt;
            return (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                </div>
            );
        });

        act(() => {
            operation.add();
        });
        act(() => {
            operation.add('1', 2);
        });

        act(() => {
            operation.add('2', -1);
        });

        wrapper.update();
        expect(getList().find(OcField).length).toEqual(3);
        expect(form.getFieldListValues()).toEqual({
            list: [undefined, '1', '2'],
        });

        act(() => {
            operation.add('0', 0);
        });
        act(() => {
            operation.add('4', 3);
        });

        wrapper.update();
        expect(getList().find(OcField).length).toEqual(5);
        expect(form.getFieldListValues()).toEqual({
            list: ['0', undefined, '1', '4', '2'],
        });
    });

    describe('validate', () => {
        test('basic', async () => {
            const [, getList] = generateForm(
                (fields) => (
                    <div>
                        {fields.map((field) => (
                            <OcField {...field} rules={[{ required: true }]}>
                                <Input />
                            </OcField>
                        ))}
                    </div>
                ),
                {
                    initialValues: { list: [''] },
                }
            );

            await changeValue(getField(getList()), '');

            expect(form.getFieldError(['list', 0])).toEqual([
                "'list.0' is required",
            ]);
        });

        test('remove should keep error', async () => {
            const [wrapper, getList] = generateForm(
                (fields, { remove }) => (
                    <div>
                        {fields.map((field) => (
                            <OcField {...field} rules={[{ required: true }]}>
                                <Input />
                            </OcField>
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                remove(0);
                            }}
                        />
                    </div>
                ),
                {
                    initialValues: { list: ['', ''] },
                }
            );

            expect(wrapper.find(Input)).toHaveLength(2);
            await changeValue(getField(getList(), 1), '');
            expect(form.getFieldError(['list', 1])).toEqual([
                "'list.1' is required",
            ]);

            wrapper.find('button').simulate('click');
            wrapper.update();

            expect(wrapper.find(Input)).toHaveLength(1);
            expect(form.getFieldError(['list', 0])).toEqual([
                "'list.1' is required",
            ]);
        });

        test('when param of remove is array', async () => {
            const [wrapper, getList] = generateForm(
                (fields, { remove }) => (
                    <div>
                        {fields.map((field) => (
                            <OcField
                                {...field}
                                rules={[{ required: true }, { min: 5 }]}
                            >
                                <Input />
                            </OcField>
                        ))}

                        <button
                            type="button"
                            onClick={() => {
                                remove([0, 2]);
                            }}
                        />
                    </div>
                ),
                {
                    initialValues: { list: ['', '', ''] },
                }
            );

            expect(wrapper.find(Input)).toHaveLength(3);
            await changeValue(getField(getList(), 0), '');
            expect(form.getFieldError(['list', 0])).toEqual([
                "'list.0' is required",
            ]);

            await changeValue(getField(getList(), 1), 'test');
            expect(form.getFieldError(['list', 1])).toEqual([
                "'list.1' must be at least 5 characters",
            ]);

            await changeValue(getField(getList(), 2), '');
            expect(form.getFieldError(['list', 2])).toEqual([
                "'list.2' is required",
            ]);

            wrapper.find('button').simulate('click');
            wrapper.update();

            expect(wrapper.find(Input)).toHaveLength(1);
            expect(form.getFieldError(['list', 0])).toEqual([
                "'list.1' must be at least 5 characters",
            ]);
            expect(wrapper.find('input').props().value).toEqual('test');
        });

        test('when add() second param is number', async () => {
            const [wrapper, getList] = generateForm(
                (fields, { add }) => (
                    <div>
                        {fields.map((field) => (
                            <OcField
                                {...field}
                                rules={[{ required: true }, { min: 5 }]}
                            >
                                <Input />
                            </OcField>
                        ))}

                        <button
                            className="button"
                            type="button"
                            onClick={() => {
                                add('test4', 1);
                            }}
                        />

                        <button
                            className="button1"
                            type="button"
                            onClick={() => {
                                add('test5', 0);
                            }}
                        />
                    </div>
                ),
                {
                    initialValues: { list: ['test1', 'test2', 'test3'] },
                }
            );

            expect(wrapper.find(Input)).toHaveLength(3);
            await changeValue(getField(getList(), 0), '');
            expect(form.getFieldError(['list', 0])).toEqual([
                "'list.0' is required",
            ]);

            wrapper.find('.button').simulate('click');
            wrapper.find('.button1').simulate('click');

            expect(wrapper.find(Input)).toHaveLength(5);
            expect(form.getFieldError(['list', 1])).toEqual([
                "'list.0' is required",
            ]);

            await changeValue(getField(getList(), 1), 'test');
            expect(form.getFieldError(['list', 1])).toEqual([
                "'list.1' must be at least 5 characters",
            ]);
        });
    });

    test('preserve should not break list', async () => {
        let operation: OcListOperations;
        const [wrapper] = generateForm(
            (fields, opt) => {
                operation = opt;
                return (
                    <div>
                        {fields.map((field) => (
                            <OcField {...field}>
                                <Input />
                            </OcField>
                        ))}
                    </div>
                );
            },
            { preserve: false }
        );

        // Add
        act(() => {
            operation.add();
        });
        wrapper.update();
        expect(wrapper.find(Input)).toHaveLength(1);

        // Remove
        act(() => {
            operation.remove(0);
        });
        wrapper.update();
        expect(wrapper.find(Input)).toHaveLength(0);

        // Add
        act(() => {
            operation.add();
        });
        wrapper.update();
        expect(wrapper.find(Input)).toHaveLength(1);
    });

    test('list support validator', async () => {
        let operation: OcListOperations;
        let currentMeta: OcMeta;
        let currentValue: any;

        const [wrapper] = generateForm(
            (_: any, opt: OcListOperations, meta: OcMeta) => {
                operation = opt;
                currentMeta = meta;
                return null;
            },
            null,
            {
                rules: [
                    {
                        validator(_: any, value: any) {
                            currentValue = value;
                            return Promise.reject();
                        },
                        message: 'Mia Lola',
                    },
                ],
            }
        );

        await act(async () => {
            operation.add();
            await timeout();
            wrapper.update();
        });

        expect(currentValue).toEqual([undefined]);
        expect(currentMeta.errors).toEqual(['Mia Lola']);
    });

    test('Nest list remove should trigger correct onValuesChange', () => {
        const onValuesChange = jest.fn();

        const [wrapper] = generateForm(
            (fields, operation) => (
                <div>
                    {fields.map((field) => (
                        <OcField {...field} name={[field.name, 'first']}>
                            <Input />
                        </OcField>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            operation.remove(1);
                        }}
                    />
                </div>
            ),
            {
                onValuesChange,
                initialValues: {
                    list: [{ first: 'lola' }, { first: 'mia' }],
                },
            }
        );

        wrapper.find('button').simulate('click');
        expect(onValuesChange).toHaveBeenCalledWith(expect.anything(), {
            list: [{ first: 'lola' }],
        });
    });

    describe('isTouched edge case', () => {
        test('virtual object', () => {
            const formRef = React.createRef<OcFormInstance>();
            const wrapper = mount(
                <OcForm ref={formRef}>
                    <OcForm.OcField name={['user', 'name']}>
                        <Input />
                    </OcForm.OcField>
                    <OcForm.OcField name={['user', 'age']}>
                        <Input />
                    </OcForm.OcField>
                </OcForm>
            );

            // Not changed
            expect(formRef.current.isTouched('user')).toBeFalsy();
            expect(formRef.current.isListTouched(['user'], false)).toBeFalsy();
            expect(formRef.current.isListTouched(['user'], true)).toBeFalsy();

            // Changed
            wrapper
                .find('input')
                .first()
                .simulate('change', { target: { value: '' } });

            expect(formRef.current.isTouched('user')).toBeTruthy();
            expect(formRef.current.isListTouched(['user'], false)).toBeTruthy();
            expect(formRef.current.isListTouched(['user'], true)).toBeTruthy();
        });

        test('OcList children change', () => {
            const [wrapper] = generateForm(
                (fields) => (
                    <div>
                        {fields.map((field) => (
                            <OcField {...field}>
                                <Input />
                            </OcField>
                        ))}
                    </div>
                ),
                {
                    initialValues: { list: ['lola', 'mia'] },
                }
            );

            // Not changed yet
            expect(form.isTouched('list')).toBeFalsy();
            expect(form.isListTouched(['list'], false)).toBeFalsy();
            expect(form.isListTouched(['list'], true)).toBeFalsy();

            // Change children value
            wrapper
                .find('input')
                .first()
                .simulate('change', { target: { value: 'little' } });

            expect(form.isTouched('list')).toBeTruthy();
            expect(form.isListTouched(['list'], false)).toBeTruthy();
            expect(form.isListTouched(['list'], true)).toBeTruthy();
        });

        test('OcList self change', () => {
            const [wrapper] = generateForm((fields, opt) => (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                    <button
                        type="button"
                        onClick={() => {
                            opt.add();
                        }}
                    />
                </div>
            ));

            // Not changed yet
            expect(form.isTouched('list')).toBeFalsy();
            expect(form.isListTouched(['list'], false)).toBeFalsy();
            expect(form.isListTouched(['list'], true)).toBeFalsy();

            // Change children value
            wrapper.find('button').simulate('click');

            expect(form.isTouched('list')).toBeTruthy();
            expect(form.isListTouched(['list'], false)).toBeTruthy();
            expect(form.isListTouched(['list'], true)).toBeTruthy();
        });
    });

    test('initialValue', () => {
        generateForm(
            (fields) => (
                <div>
                    {fields.map((field) => (
                        <OcField {...field}>
                            <Input />
                        </OcField>
                    ))}
                </div>
            ),
            null,
            { initialValue: ['lola', 'mia'] }
        );

        expect(form.getFieldListValues()).toEqual({
            list: ['lola', 'mia'],
        });
    });

    test('ListContext', () => {
        const Hooker = ({ field }: any) => {
            const { getKey } = React.useContext(OcListContext);
            const [key, restPath] = getKey(['list', field.name, 'user']);

            return (
                <>
                    <span className="internal-key">{key}</span>
                    <span className="internal-rest">{restPath.join('_')}</span>

                    <OcField {...field} name={[field.name, 'user']}>
                        <Input />
                    </OcField>
                </>
            );
        };

        const [wrapper] = generateForm(
            (fields) => (
                <div>
                    {fields.map((field) => {
                        return <Hooker field={field} key={field.key} />;
                    })}
                </div>
            ),
            {
                initialValues: {
                    list: [{ user: 'mia' }],
                },
            }
        );

        expect(wrapper.find('.internal-key').text()).toEqual('0');
        expect(wrapper.find('.internal-rest').text()).toEqual('user');
        expect(wrapper.find('input').prop('value')).toEqual('mia');
    });
});
