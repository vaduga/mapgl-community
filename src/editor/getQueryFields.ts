import {FieldOverrideContext, getFieldDisplayName} from "@grafana/data";

export const getQueryFields = async (context: FieldOverrideContext) => {
    const options = [];
    if (context && context.data && context.data.length > 0 && context.options && context.options.query && context.options.query.options) {
        const frames = context.data;
        for (let i = 0; i < frames.length; i++) {
            if (frames[i].refId && frames[i].refId === context.options.query.options) {
                const frame = context.data[i];
                for (const field of frame.fields) {
                    const name = getFieldDisplayName(field, frame, context.data);
                    const value = field.name;
                    options.push({ value, label: name } as never);
                }
            }
        }
    }
    else if (context && context.data && context.data.length > 0 && context.data[0]) {  ///.meta
        const frames = context.data;
        for (let i = 0; i < frames.length; i++) {
            const frame = context.data[i];
            for (const field of frame.fields) {
                const name = getFieldDisplayName(field, frame, context.data);
                const value = field.name;
                options.push({ value, label: name } as never);
            }
        }
    }
    return options;
}
