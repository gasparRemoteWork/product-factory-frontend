import React, {useState, useEffect, memo} from 'react';
import {TreeSelect} from 'antd';

// Values are also selected when clicking the title of the node to expand it
// We only want the values selected by marking the checkboxes
// The porpuse of this class is only leaving the checkboxes selected values
const CustomTreeSelect = ({onTreeExpand=(expandkeys) => {}, onChange= (values) => {}, value, multiple=false, ...restProps}) => {
    let [thereWasExpansionOrCollapsing, setThereWasExpansionOrCollapsing]  = useState(false)
    let [selecteds, setSelecteds] = useState([])

    const valueProp = value ? value : selecteds
    restProps = {...restProps, value: valueProp}

    useEffect(() => {
        if (thereWasExpansionOrCollapsing) {
            setThereWasExpansionOrCollapsing(false)
        }
    }, [thereWasExpansionOrCollapsing])

    return (
        <TreeSelect
            {...restProps}
            treeExpandAction={'click'}
            treeCheckable
            treeCheckStrictly
            onTreeExpand={(expandkeys) => {
                thereWasExpansionOrCollapsing=true;
                setThereWasExpansionOrCollapsing(thereWasExpansionOrCollapsing)
                onTreeExpand(expandkeys)
            }}
            onChange={
                (values) => {
                    if (!thereWasExpansionOrCollapsing) {
                        selecteds = values
                    }
                    selecteds = typeof selecteds == 'object' && selecteds.filter ? selecteds.filter (s => s != undefined) : [selecteds]
                    if (!multiple) {
                        selecteds = selecteds.length >= 1 ? selecteds[selecteds.length - 1] : undefined
                    }
                    setSelecteds(selecteds)
                    thereWasExpansionOrCollapsing = false
                    onChange(selecteds) 
                }
            }
        />
    )
}

export default memo(CustomTreeSelect)