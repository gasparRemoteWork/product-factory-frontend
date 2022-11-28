import React from "react";
import {ExpertiseTableProps} from "../interfaces";
import {Col, Row, Typography} from "antd";
import {TreeNode} from "antd/lib/tree-select";
import {Skill} from "../../SkillsComponents/interfaces";
import CustomTreeSelect from "../../CustomTreeSelect/CustomTreeSelect";

const ExpertiseTable = ({skills, setSkills, skillExpertise}: ExpertiseTableProps) => {

    const expertiseSelectChange = (skill: string, value: string[], index: number) => {
        setSkills((prevState: Skill[]) => {
            let {category} = prevState[index];
            return [...prevState.slice(0, index), {category, expertise: value}, ...prevState.slice(index + 1)];
        });
    }


    const expertiseTree = (index: number, skillExp) => {
        return (
            <CustomTreeSelect
                key={index}
                style={{minWidth: 200, padding: 5, width: "max-content"}}
                allowClear={false}
                onChange={(value) => expertiseSelectChange(skillExp.skill[1], value.map(v => v.value) as string[], index)}
                placeholder={"Please Select Expertise"}
                value={skills[index].expertise ? skills[index].expertise : []}
                multiple
                bordered
                showArrow>
                {
                    Object.keys(skillExp.expertise).map((expertise) => (
                        <TreeNode
                            value={expertise}
                            selectable={false}
                            title={expertise}
                            checkable={false}
                        >
                            {(Object(skillExp.expertise)[expertise] as string[]).map((value) => (
                                <TreeNode
                                    value={value}
                                    selectable={true}
                                    title={value}
                                    checkable={true}
                                >
                                    {value}
                                </TreeNode>
                            ))}
                        </TreeNode>
                    ))
                }
            </CustomTreeSelect>
        )
    }

    return (
        <>
            <Row>
                <Col>
                    <Row style={{backgroundColor: '#FAFAFA', padding: '11px 42px', minWidth: 220}}>
                        Skill
                    </Row>
                </Col>
                <Col>
                    <Row style={{backgroundColor: '#FAFAFA', padding: '11px 42px', minWidth: 220}}>
                        Expertise
                    </Row>
                </Col>
            </Row>
            {skillExpertise && skillExpertise.length > 0 && skillExpertise.map((skillExp, index) => (
                <Row>
                    <Col>
                        <Row style={{borderBottom: '1px solid #FAFAFA', height: "100%", alignItems: "center"}}
                             key={index}>
                            <Typography.Text style={{
                                fontSize: 11,
                                minWidth: 200,
                                padding: 5,
                                width: "max-content"
                            }}>{skillExp.skill[0].slice(0, 12) + '... > ' + skillExp.skill[1]}</Typography.Text>
                        </Row>
                    </Col>
                    <Col>
                        <Row style={{borderBottom: '1px solid #FAFAFA', height: "100%", alignItems: "center"}}
                             key={index}>
                            {Object.keys(skillExp.expertise).length > 0 ? expertiseTree(index, skillExp) :
                                <Typography.Text>No selections available</Typography.Text>}

                        </Row>
                    </Col>
                </Row>
            ))}
        </>
    );
}

export default ExpertiseTable;