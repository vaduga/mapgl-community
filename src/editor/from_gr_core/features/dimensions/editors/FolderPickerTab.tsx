import { css } from '@emotion/css';
import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Field, FilterInput, Select, useStyles2 } from '@grafana/ui';
import {
    getDataSourceSrv as getDataSourceService,
} from '@grafana/runtime';
export const getDatasourceSrv = () => {
    return getDataSourceService()
};


import { MediaType, ResourceFolderName } from '../types';

import { ResourceCards } from './ResourceCards';
import {getPublicOrAbsoluteUrl} from "../resource";
import {CiscoIcons, DatabaseIcons, NetworkingIcons} from "../../../../IconsSVG/data/iconOptions";

const absPath= 'public/plugins/vaduga-mapgl-panel/img/icons/'

const ciscoIconsFormatted = CiscoIcons.map((t) => {
    return { label: t, value: `cisco/${t}`,
        search: t.toLowerCase(),
        imgUrl: absPath+'cisco/' + t+'.svg',
    };
});
const networkingIconsFormatted = NetworkingIcons.map((t) => {
    return { label: t, value:`networking/${t}`,
    search: t.toLowerCase(),
    imgUrl: absPath+'networking/' + t+'.svg',
    };
});
const databaseIconsFormatted = DatabaseIcons.map((t) => {
    return { label: t, value:`databases/${t}`,
    search: t.toLowerCase(),
    imgUrl: absPath+'databases/' + t+'.svg',
    };
});




const foldersMap = {
    [ResourceFolderName.Cisco] : ciscoIconsFormatted,
    [ResourceFolderName.Networking] : networkingIconsFormatted,
    [ResourceFolderName.Databases] : databaseIconsFormatted,

}

const getFolders = (mediaType: MediaType) => {
    if (mediaType === MediaType.Icon) {
        return [ResourceFolderName.Networking, ResourceFolderName.Databases, ResourceFolderName.Cisco, ResourceFolderName.Custom];
    } else {
        return [ResourceFolderName.BG];
    }
};

const getFolderIfExists = (folders: Array<SelectableValue<string>>, path: string) => {
    return folders.find((folder) => {

        const substring = path.split('/').slice(0, -1).toString()
        return folder?.value?.includes(substring)

    }) ?? folders[0]
};

export interface ResourceItem {
    label: string;
    value: string; // includes folder
    search: string;
    imgUrl: string;
}

interface Props {
    value?: string;
    mediaType: MediaType;
    folderName: ResourceFolderName;
    newValue: string;
    setNewValue: Dispatch<SetStateAction<string>>;
    maxFiles?: number;
}

export const FolderPickerTab = (props: Props) => {
    const { value, mediaType, folderName, newValue, setNewValue, maxFiles } = props;
    const styles = useStyles2(getStyles);

    const folders = getFolders(mediaType).map((v) => ({
        label: v,
        value: v,
    }));

    const [searchQuery, setSearchQuery] = useState<string>();

    const [currentFolder, setCurrentFolder] = useState<SelectableValue<string>>(
        getFolderIfExists(folders, value?.length ? value : folderName)
    );
    const [directoryIndex, setDirectoryIndex] = useState<ResourceItem[]>([]);
    const [filteredIndex, setFilteredIndex] = useState<ResourceItem[]>([]);

    const onChangeSearch = (query: string) => {
        if (query) {
            query = query.toLowerCase();
            setFilteredIndex(directoryIndex.filter((card) => card.search.includes(query)));
        } else {
            setFilteredIndex(directoryIndex);
        }
    };

    useEffect(() => {
        // we don't want to load everything before picking a folder
        const folder = currentFolder?.value;

        if (folder === ResourceFolderName.Custom) {
            const filter =
                mediaType === MediaType.Icon
                    ? (item ) => item.name.endsWith('.svg')
                    : (item ) => item.name.endsWith('.png') || item.name.endsWith('.gif');

            getDatasourceSrv()
                .get('-- Grafana --')
                .then((ds: any) => {
                    const f = (ds).listFiles(folder.replace(/^public\//, ''), maxFiles)

                    f.subscribe({
                        next: (frame) => {

                            const cards: ResourceItem[] = [];
                            frame.forEach((item) => {
                                if (filter(item) || true) {

                                    const idx = item.name.lastIndexOf('.');
                                    cards.push({
                                        value: `${folder}/${item.name}`,
                                        label: item.name,
                                        search: (idx ? item.name.substring(0, idx) : item.name).toLowerCase(),
                                        imgUrl: `${folder}/${item.name}`,
                                    });
                                }
                            });


                            setDirectoryIndex(cards);
                            setFilteredIndex(cards);

                        },
                    });
                })

        //// skip parsing predefined icons from plugin folder
            return
        }

        if (folder)
        {

            const cards: ResourceItem[] = foldersMap[folder]
            setDirectoryIndex(cards);
            setFilteredIndex(cards);
        }


    }, [mediaType, currentFolder, maxFiles]);

    return (
        <>
            <Field>
                <Select options={folders} onChange={setCurrentFolder} value={currentFolder} menuShouldPortal={false} />
            </Field>
            <Field>
                <FilterInput
                    value={searchQuery ?? ''}
                    placeholder="Search"
                    onChange={(v) => {
                        onChangeSearch(v);
                        setSearchQuery(v);
                    }}
                />
            </Field>
            {filteredIndex && (
                <div className={styles.cardsWrapper}>
                    <ResourceCards cards={filteredIndex} onChange={(v) => setNewValue(v)} value={newValue} />
                </div>
            )}
        </>
    );
};

const getStyles = (theme: GrafanaTheme2) => ({
    cardsWrapper: css`
    height: 30vh;
    min-height: 50px;
    margin-top: 5px;
    max-width: 680px;
  `,
});
