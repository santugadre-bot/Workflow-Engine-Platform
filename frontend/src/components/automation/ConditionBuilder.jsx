import { useState, useEffect } from 'react';
import { HiPlus, HiTrash } from 'react-icons/hi';

export default function ConditionBuilder({ value, onChange }) {
    const [conditions, setConditions] = useState([]);

    useEffect(() => {
        try {
            const parsed = JSON.parse(value || '[]');
            if (Array.isArray(parsed)) {
                setConditions(parsed);
            }
        } catch (e) {
            setConditions([]);
        }
    }, [value]);

    const updateCondition = (index, field, val) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: val };
        setConditions(newConditions);
        onChange(JSON.stringify(newConditions));
    };

    const addCondition = () => {
        const newConditions = [...conditions, { field: 'priority', operator: 'EQUALS', value: '' }];
        setConditions(newConditions);
        onChange(JSON.stringify(newConditions));
    };

    const removeCondition = (index) => {
        const newConditions = conditions.filter((_, i) => i !== index);
        setConditions(newConditions);
        onChange(JSON.stringify(newConditions));
    };

    return (
        <div className="space-y-2">
            {conditions.map((condition, index) => (
                <div key={index} className="flex gap-2 items-center">
                    <select
                        className="input text-sm"
                        value={condition.field}
                        onChange={(e) => updateCondition(index, 'field', e.target.value)}
                    >
                        <option value="priority">Priority</option>
                        <option value="status">Status</option>
                        <option value="assignee">Assignee</option>
                    </select>

                    <select
                        className="input text-sm"
                        value={condition.operator}
                        onChange={(e) => updateCondition(index, 'operator', e.target.value)}
                    >
                        <option value="EQUALS">Equals</option>
                        <option value="NOT_EQUALS">Not Equals</option>
                        <option value="CONTAINS">Contains</option>
                        <option value="IS_NULL">Is Empty</option>
                    </select>

                    <input
                        className="input text-sm flex-1"
                        placeholder="Value"
                        value={condition.value}
                        onChange={(e) => updateCondition(index, 'value', e.target.value)}
                        disabled={condition.operator === 'IS_NULL'}
                    />

                    <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => removeCondition(index)}>
                        <HiTrash />
                    </button>
                </div>
            ))}
            <button type="button" className="btn btn-ghost btn-xs text-primary gap-1" onClick={addCondition}>
                <HiPlus /> Add Condition
            </button>
        </div>
    );
}
