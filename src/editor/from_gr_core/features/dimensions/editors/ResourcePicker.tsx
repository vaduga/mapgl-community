import { css } from '@emotion/css';
import React, { createRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import {
    Button, Field,
    InlineField,
    InlineFieldRow,
    Input,
    LinkButton,
    Popover,
    PopoverController,
    useStyles2,
    useTheme2,
} from '@grafana/ui';
//import { SanitizedSVG } from 'app/core/components/SVG/SanitizedSVG';

import { getPublicOrAbsoluteUrl } from '../resource';
import { MediaType, ResourceFolderName, ResourcePickerSize } from '../types';
import {closePopover} from "../../../ui/src/utils/closePopover";
import {SanitizedSvg} from "../../../components/SVG/SanitizedSvg";
import {ResourcePickerPopover} from "./ResourcePickerPopover";

//import { ResourcePickerPopover } from './ResourcePickerPopover';

interface Props {
    onChange: (value?: string) => void;
    mediaType: MediaType;
    folderName: ResourceFolderName;
    size: ResourcePickerSize;
    onClear?: (event: React.MouseEvent) => void;
    value?: string; //img/icons/unicons/0-plus.svg
    src?: string;
    name?: string;
    placeholder?: string;
    color?: string;
    maxFiles?: number;
}

export const ResourcePicker = (props: Props) => {
    const { value, src, name, placeholder, onChange, onClear, mediaType, folderName, size, color, maxFiles } = props;

    const styles = useStyles2(getStyles);
    const theme = useTheme2();

    const pickerTriggerRef = createRef<HTMLDivElement>();
    const popoverElement = (
        <ResourcePickerPopover
            onChange={onChange}
            value={value}
            mediaType={mediaType}
            folderName={folderName}
            maxFiles={maxFiles}
        />
    );

    let sanitizedSrc = src;
    if (!sanitizedSrc && value) {
        sanitizedSrc = getPublicOrAbsoluteUrl(value);
    }

    const colorStyle = color && {
        fill: theme.visualization.getColorByName(color),
    };

    const renderSmallResourcePicker = () => {
        if (value && sanitizedSrc) {
            return <SanitizedSvg src={sanitizedSrc} className={styles.icon} style={{ ...colorStyle }} />;
        } else {
            return (
                <LinkButton variant="primary" fill="text" size="sm">
                    Set icon
                </LinkButton>
            );
        }
    };

    const renderNormalResourcePicker = () => (
            // <InlineField label={null} grow>
                <Input
                    value={getDisplayName(src, name)}
                    placeholder={placeholder}
                    readOnly={true}
                    prefix={sanitizedSrc && <SanitizedSvg cleanStyle={true} src={sanitizedSrc} className={styles.icon} style={{ ...colorStyle }} />}
                    suffix={<Button icon="times" variant="secondary" fill="text" size="sm" onClick={onClear} />}
                />
            // </InlineField>

    );

    return (
        <PopoverController content={popoverElement}>
            {(showPopper, hidePopper, popperProps) => {
                return (
                    <>
                        {pickerTriggerRef.current && (
                            <Popover
                                {...popperProps}
                                referenceElement={pickerTriggerRef.current}
                                onMouseEnter={showPopper}
                                onKeyDown={(event) => {
                                    closePopover(event, hidePopper);
                                }}
                            />
                        )}

                        <div
                            ref={pickerTriggerRef}
                            className={styles.pointer}
                            onClick={showPopper}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === 'Enter') {
                                    showPopper();
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            {size === ResourcePickerSize.SMALL && renderSmallResourcePicker()}
                            {size === ResourcePickerSize.NORMAL && renderNormalResourcePicker()}
                        </div>
                    </>
                );
            }}
        </PopoverController>
    );
};

// strip the SVG off icons in the icons folder
function getDisplayName(src?: string, name?: string): string | undefined {
    if (src) {
        const idx = name?.lastIndexOf('.svg') ?? 0;
        if (idx > 0) {
            return name!.substring(0, idx);
        }
    }
    return name;
}

const getStyles = (theme: GrafanaTheme2) => ({
    pointer: css`
    cursor: pointer;
    input[readonly] {
      cursor: pointer;
    }
  `,
    icon: css`
    vertical-align: middle;
    display: inline-block;
    fill: currentColor;
    width: 25px;
  `,
});
