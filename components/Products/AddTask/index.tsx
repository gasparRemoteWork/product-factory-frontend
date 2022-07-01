import React, {useEffect, useState} from "react";
import {connect} from "react-redux";
import {Modal, Row, Col, Input, Select, message, TreeSelect} from "antd";
import {useMutation, useQuery} from "@apollo/react-hooks";
import {
    GET_CAPABILITIES_BY_PRODUCT, GET_CATEGORIES_LIST, GET_CONTRIBUTOR_GUIDES,
    GET_INITIATIVES_SHORT,
    GET_TAGS,
    GET_USERS,
    GET_EXPERTISES_LIST,
} from "../../../graphql/queries";
import {CREATE_TASK, UPDATE_TASK} from "../../../graphql/mutations";
import {TASK_TYPES, TASK_PRIORITIES} from "../../../graphql/types";
import AddInitiative from "../AddInitiative";
import {PlusOutlined, MinusOutlined} from "@ant-design/icons";
import {RICH_TEXT_EDITOR_WIDTH} from "../../../utilities/constants";
import {getProp} from "../../../utilities/filters";
import RichTextEditor from "../../RichTextEditor";
import showUnAuthModal from "../../UnAuthModal";


const {Option} = Select;
const {TextArea} = Input;
const {TreeNode} = TreeSelect;

interface IUser {
    firstName: string
    slug: string
}

type Props = {
    modal?: boolean;
    productSlug?: string;
    closeModal: any;
    currentProduct?: any;
    tags?: any;
    modalType?: boolean;
    task?: any;
    submit?: any;
    tasks?: Array<any>;
    user: any;
    initiativeID: number;
    capabilityID: number;
    loginUrl: string;
    registerUrl: string;
};

interface Category {
    active: boolean,
    selectable: boolean,
    name: string,
    children: Category[]
}

interface Expertise {
    selectable: boolean,
    id: number,
    name: string,
    children: Expertise[]
}

const AddTask: React.FunctionComponent<Props> = (
    {
        modal,
        productSlug,
        closeModal,
        modalType,
        task,
        submit,
        tasks,
        user,
        initiativeID,
        capabilityID,
        loginUrl,
        registerUrl
    }
) => {
    const [title, setTitle] = useState(modalType ? task.title : "");

    const [treeData, setTreeData] = useState<any>([]);
    const [allTags, setAllTags] = useState([]);
    const [skip, setSkip] = React.useState(false);
    const [allCategories, setAllCategories] = React.useState([]);
    const [allExpertises, setAllExpertises] = React.useState([]);
    const [availableExpertises, setAvailableExpertises] = React.useState([]);
    const [allGuides, setAllGuides] = useState([]);
    const [shortDescription, setShortDescription] = useState(
        modalType ? task.shortDescription : ""
    );
    
    const [category, setCategory] = useState(modalType ? task.taskCategory : "");
    const [expertise, setExpertise] = useState([]);
    const [contributionGuide, setContributionGuide] = useState(
        modalType ? task.contributionGuide?.id || null : null
    );
    const [description, setDescription] = useState(
        modalType ? task.description : ""
    );
    const [videoUrl, setVideoUrl] = useState(
        modalType ? task.videoUrl : ""
    );
    const [longDescriptionClear, setLongDescriptionClear] = useState(0);
    const [status, setStatus] = useState(modalType ? task.status : 2);
    const [priority, setPriority] = useState<string | number | null>(modalType ? TASK_PRIORITIES.indexOf(task.priority) : null);
    const [capability, setCapability] = useState(
        modalType && task.capability ? task.capability.id : capabilityID
    );
    const [initiative, setInitiative] = useState(
        modalType && task.initiative ? task.initiative.id : initiativeID
    );
    const [initiatives, setInitiatives] = useState([])
    const [editInitiative, toggleInitiative] = useState(false);
    const [tags, setTags] = useState(
        modalType && task.tag ? task.tag.map((tag: any) => tag.name) : []
    );

    const [tagsSearchValue, setTagsSearchValue] = useState("");
    const tagsSearchValueChangeHandler = (val: any) => {
        const re = /^[a-zA-Z0-9-]{0,128}$/;

        if (re.test(val)) {
            setTagsSearchValue(val);
        } else if (val.length > 1 && (val[val.length - 1] === " " || val[val.length - 1] === ",")) {
            setTags((prev: any) => [...prev, val.slice(0, -1)]);
            setTagsSearchValue("");
        } else {
            message.warn("Tags can only include letters, numbers and -, with the max length of 128 characters").then()
        }
    };

    useEffect(() => {
        if (reviewSelectValue === "") {
            setReviewSelectValue(getProp(user, "slug", ""));
        }
    }, [user]);

    const [dependOn, setDependOn] = useState(
        modalType && task.dependOn ? task.dependOn.map((tag: any) => tag.id) : []
    );

    const {
        data: originalInitiatives,
        loading: initiativeLoading,
        refetch: fetchInitiatives
    } = useQuery(GET_INITIATIVES_SHORT, {
        variables: {productSlug, status: 1}
    });
    const {data: capabilitiesData, loading: capabilitiesLoading} = useQuery(GET_CAPABILITIES_BY_PRODUCT, {
        variables: {productSlug}
    });
    const {data: categories} = useQuery(GET_CATEGORIES_LIST);
    const {data: expertises} = useQuery(GET_EXPERTISES_LIST);
    const {data: tagsData} = useQuery(GET_TAGS, {
        variables: {productSlug}
    });
    const [createTask] = useMutation(CREATE_TASK);
    const [updateTask] = useMutation(UPDATE_TASK);
    const [allUsers, setAllUsers] = useState([]);
    const [reviewSelectValue, setReviewSelectValue] = useState(getProp(task, "reviewer.slug", ""));
    const {data: users} = useQuery(GET_USERS);
    const {data: guidesData} = useQuery(GET_CONTRIBUTOR_GUIDES, {
        variables: {productSlug}
    });

    const filterOption = (input: string, option: any) => option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0;

    const convertDataAndSetTree = (capabilities: any) => {
        let capabilitiesData: string = "";
        if (capabilities && capabilities.capabilities) {
            capabilitiesData = getProp(capabilities, "capabilities", "");
            try {
                if (capabilitiesData !== "") {
                    capabilitiesData = JSON.parse(capabilitiesData);
                    //@ts-ignore
                    setTreeData(capabilitiesData.length > 0 && capabilitiesData[0].children
                        //@ts-ignore
                        ? formatData(capabilitiesData[0].children) : [])
                } else {
                    setTreeData([]);
                }
            } catch (e) {
                if (e instanceof SyntaxError) setTreeData([]);
            }
        } else {
            setTreeData([]);
        }
    }

    const formatData = (data: any) => {
        return data.map((node: any) => {
            const nodeId = getProp(node, "id");

            return {
                id: nodeId,
                title: getProp(node, "data.name"),
                value: nodeId,
                description: getProp(node, "data.description", ""),
                videoLink: getProp(node, "data.video_link", ""),
                children: node.children ? formatData(getProp(node, "children", [])) : [],
                expanded: isExpandedById(nodeId)
            }
        })
    }

    const isExpandedById = (id: number, data?: any) => {
        if (!data) data = treeData;
        let isExpanded: boolean = false;

        data.map((node: any) => {
            if (getProp(node, "id") === id && getProp(node, "expanded", false)) {
                isExpanded = true;
                return;
            }

            if (getProp(node, "children", []).length > 0) {
                if (isExpandedById(id, node.children)) {
                    isExpanded = true;
                }
            }
        });

        return isExpanded;
    }

    // @ts-ignore
    tasks = tasks.filter(dependOnTask => {
        let tId = task && task.hasOwnProperty("id") ? task.id : undefined;
        return tId != dependOnTask.id
    });

    useEffect(() => {
        setAllUsers(getProp(users, "people", []));
    }, [users]);


    const findCategory = (categories: Category[], value: string, parent: Category): Category | undefined => {
        for (let category of categories) {
            if (category.children && category.children.length > 0) {
                const skill = findCategory(category.children, value, category);
                if (skill) {
                    return skill;
                }
            } else if (category.name === value) {
                category['parent'] = parent;
                return category;
            }
        }
    }

    useEffect(() => {
        if (category && category !== "" && allCategories.length) {
            // @ts-ignore
            const taskCategory = findCategory(allCategories, category, null);
            if (taskCategory) {
                // @ts-ignore
                var ae = [];
                for(let expertise of allExpertises){
                    if(expertise.category === taskCategory['id']) {
                        ae.push(expertise);
                    }
                }
                setAvailableExpertises(ae);
                setExpertise([]);
            } 

            if(!modalType && allGuides) {
                setContributionGuide(null);
                allGuides.map((guide) => {
                    if(guide.category && guide.category.name == category)
                        setContributionGuide(guide.id);
                });
            }

        }

    }, [category]);

    useEffect(() => {
        if(allExpertises.length) {
            if (category && category !== "" && allCategories.length) {
                // @ts-ignore
                const taskCategory = findCategory(allCategories, category, null);
                if (taskCategory) {
                    // @ts-ignore
                    var ae = [];
                    for(let expertise of allExpertises){
                        if(expertise.category === taskCategory['id']) {
                            ae.push(expertise);
                        }
                    }
                    setAvailableExpertises(ae);    
                }
            }            
        }

    }, [allExpertises])

    useEffect(() =>{
        // only update expertise list when updating a task
        if(availableExpertises.length && task && task.taskExpertise && task.taskExpertise.length) {
            var exp = [];
            task.taskExpertise.map((ex) => {exp.push(parseInt(ex.id))});
            setExpertise(exp);
        }

    }, [availableExpertises])

    useEffect(() => {
        if (categories?.taskCategoryListing) {
            setAllCategories(JSON.parse(categories.taskCategoryListing));
        }
    }, [categories]);

    useEffect(() => {
        if (expertises?.expertisesListing) {
            setAllExpertises(JSON.parse(expertises.expertisesListing));
        }
    }, [expertises])

    useEffect(() => {
        if (!capabilitiesLoading && !capabilitiesData.hasOwnProperty("error")) {
            convertDataAndSetTree(capabilitiesData);
        }
    }, [capabilitiesData]);

    useEffect(() => {
        if (tagsData && tagsData.tags) setAllTags(tagsData.tags)
    }, [tagsData]);

    useEffect(() => {
        if (guidesData && guidesData.contributorGuides) {
            setAllGuides(guidesData.contributorGuides);
        }
    }, [guidesData]);

    useEffect(() => {
        if (!initiativeLoading && !!originalInitiatives && !skip) {
            setSkip(true)
        }
    }, [originalInitiatives, initiativeLoading]);

    useEffect(() => {
        if (!skip) fetchInitiatives({productSlug})
    }, [skip]);

    useEffect(() => {
        if (originalInitiatives) {
            setInitiatives(originalInitiatives.initiatives);
        }
    }, [originalInitiatives]);

    const handleOk = async () => {
        if (!title) {
            message.error("Title is required. Please fill out title");
            return;
        }
        if (!description || description === "<p></p>") {
            message.error("Long description is required. Please fill out description");
            return;
        }
        if (!reviewSelectValue) {
            message.error("Reviewer is required. Please fill out reviewer");
            return;
        }

        await addNewTask();
    };

    const handleCancel = () => {
        closeModal(!modal);
        clearData();
    };

    const clearData = () => {
        setTitle("");
        setPriority(null);
        setStatus(2);
        setLongDescriptionClear(prev => prev + 1);
        setShortDescription("");
        setVideoUrl("");
        setCapability(0);
        setInitiative(0);
        setCapability([]);
        setTags([]);
        setDependOn([]);
        setReviewSelectValue(getProp(user, "slug", null));
        setExpertise("");
        setCategory("");
    }

    const addNewTask = async () => {
        const input = {
            title,
            description,
            videoUrl,
            shortDescription: shortDescription,
            status: status,
            productSlug,
            initiative: Boolean(initiative) ? parseInt(initiative) : null,
            capability: capability === 0 ? null : parseInt(capability),
            tags,
            dependOn,
            priority,
            contributionGuide,
            reviewer: reviewSelectValue,
            category: category ? findCategory(allCategories, category, null).id : "",
            expertise
        };

        try {
            const res = modalType
                ? await updateTask({
                    variables: {input, id: parseInt(task.id)}
                })
                : await createTask({
                    variables: {input}
                })

            const modalTypeText = modalType ? "updateTask" : "createTask";
            const messageText = getProp(res, `data.${modalTypeText}.message`, "");

            if (messageText && getProp(res, `data.${modalTypeText}.status`, false)) {
                submit();
                message.success(messageText);

                clearData();
            } else if (messageText) {
                message.error(messageText);
            }

            closeModal(!modal);
        } catch (e) {
            if(e.message === "The person is undefined, please login to perform this action") {
                closeModal(!modal);
                showUnAuthModal("perform this action", loginUrl, registerUrl, true);
            } else {
                message.error(e.message);
            }
        }
    }

    const updateInitiatives = async () => {
        const {data: newData} = await fetchInitiatives({
            productSlug: productSlug
        });

        setInitiatives(newData.initiatives);
    }

    const makeCategoriesTree = (categories: Category[]) => {
        return categories.map((category, index) => (
            <TreeNode id={index} selectable={category.selectable} value={category.name} title={category.name}>
                {category.children ? makeCategoriesTree(category.children) : null}
            </TreeNode>));
    }

    const makeExpertisesTree = (expertises: Expertise[]) => {
        return expertises.map((expertise, index) => (
            <TreeNode id={index} selectable={expertise.selectable} value={expertise.id} title={expertise.name}>
                {expertise.children ? makeExpertisesTree(expertise.children) : null}
            </TreeNode>));
    }

    const reviewSelectChange = (val: any) => {
        setReviewSelectValue(val);
    }

    const filterTreeNode = (input: string, node: any) => node.title.toLowerCase().indexOf(input.toLowerCase()) !== -1;

    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    // @ts-ignore
    return (
        <>
            <Modal
                title={`${modalType ? "Edit" : "Add"} Challenge`}
                visible={modal}
                onOk={handleOk}
                onCancel={handleCancel}
                className="add-modal add-task-modal"
                width={RICH_TEXT_EDITOR_WIDTH}
                maskClosable={false}
            >
                <Row className="mb-15">
                    <label>Title*:</label>
                    <Input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </Row>
                <Row className="mb-15">
                    <Col span={24}>
                        <label>Short Description*:</label>
                    </Col>
                    <Col span={24}>
                        <TextArea
                            placeholder="Short Description"
                            value={shortDescription}
                            onChange={(e) => setShortDescription(e.target.value)}
                            maxLength={256}
                            showCount
                            required
                        />
                    </Col>
                </Row>
                <Row style={{width: "100%"}}>
                    <Col span={24}>
                        <label>Long Description*:</label>
                        <RichTextEditor initialHTMLValue={description} onChangeHTML={setDescription}
                                        clear={longDescriptionClear}/>
                    </Col>
                </Row>
                {
                    treeData.length > 0 && (
                        <Row className="mb-15">
                            <label>Capability:</label>
                            <TreeSelect
                                showSearch
                                style={{width: "100%"}}
                                value={capability ? capability : null}
                                dropdownStyle={{maxHeight: 400, overflow: "auto"}}
                                placeholder="Please select"
                                allowClear
                                treeData={treeData}
                                treeDefaultExpandAll
                                filterTreeNode={filterTreeNode}
                                onChange={setCapability}
                            />
                        </Row>
                    )
                }
                {initiatives && (
                    <>
                        <Row justify="space-between" className="mb-5">
                            <Col>
                                <label>Initiative:</label>
                            </Col>
                            <Col>
                                {!editInitiative ? (
                                    <PlusOutlined
                                        className="my-auto mb-10"
                                        onClick={() => toggleInitiative(!editInitiative)}
                                    />
                                ) : (
                                    <MinusOutlined
                                        className="my-auto mb-10"
                                        onClick={() => toggleInitiative(!editInitiative)}
                                    />
                                )}
                            </Col>
                            {editInitiative && (
                                <AddInitiative
                                    modal={editInitiative}
                                    productSlug={String(productSlug)}
                                    modalType={false}
                                    closeModal={toggleInitiative}
                                    submit={updateInitiatives}
                                />
                            )}
                        </Row>
                        <Row className="mb-15">
                            <Select
                                onChange={setInitiative}
                                placeholder="Select initiative"
                                filterOption={filterOption}
                                showSearch
                                value={initiative ? initiative : null}
                                allowClear
                            >
                                {initiatives.map((option: any, idx: number) => (
                                    <Option key={`init${idx}`} value={option.id}>
                                        {option.name}
                                    </Option>
                                ))}
                            </Select>
                        </Row>
                    </>
                )}
                <Row className="mb-15">
                    <label>Status: </label>
                    <Select
                        value={status}
                        onChange={setStatus}
                        placeholder="Select status"
                    >
                        {TASK_TYPES.map((option: string, idx: number) => (
                            <Option key={`status${idx}`} value={idx}>{option}</Option>
                        ))}
                    </Select>
                </Row>
                <Row className="mb-15">
                    <label>Priority: </label>
                    <Select
                        value={priority}
                        onChange={setPriority}
                        placeholder="Select priority"
                    >
                        {TASK_PRIORITIES.map((option: string, idx: number) => (
                            <Option key={`priority-${idx}`} value={idx}>{option}</Option>
                        ))}
                    </Select>
                </Row>
                <Row className="mb-15">
                    <label>Tags:</label>
                    <Select
                        mode="multiple"
                        onChange={setTags}
                        searchValue={tagsSearchValue}
                        onSearch={(e) => tagsSearchValueChangeHandler(e)}
                        filterOption={filterOption}
                        placeholder="Select tags"
                        value={tags}
                    >
                        {allTags && allTags.map((option: any, idx: number) => (
                            <Option key={`cap${idx}`} value={option.name}>
                                {option.name}
                            </Option>
                        ))}
                    </Select>
                </Row>
                <Row className="mb-15">
                    <label>Task category:</label>
                    <TreeSelect
                        allowClear
                        onChange={setCategory}
                        placeholder="Select task category"
                        value={category}
                    >
                        {allCategories && makeCategoriesTree(allCategories)}
                    </TreeSelect>
                </Row>
                <Row className="mb-15">
                    <label>Expertise:</label>
                    <TreeSelect
                        allowClear
                        onChange={setExpertise}
                        value={expertise}
                        placeholder="Select expertise"
                        disabled={!category}
                        multiple
                    >
                        {availableExpertises && makeExpertisesTree(availableExpertises)}
                        </TreeSelect>
                </Row>
                <Row className="mb-15">
                    <label>Video Link:</label>
                    <Input
                        placeholder="Video link"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        required
                    />
                </Row>
                <Row className="mb-15">
                    <label>Dependant on:</label>
                    <Select
                        mode="multiple"
                        onChange={setDependOn}
                        filterOption={filterOption}
                        placeholder="Select depend on tasks"
                        value={dependOn}
                    >
                        {tasks &&
                        tasks.map((option: any, idx: number) => (
                            <Option key={`cap${idx}`} value={option.challenge.id}>
                                {option.title}
                            </Option>
                        ))}
                    </Select>
                </Row>
                <Row>
                    <label>Contributing Guide:</label>
                    <Select
                        onChange={setContributionGuide}
                        placeholder="Select contributing guide"
                        value={contributionGuide}
                        allowClear={true}
                    >
                        {allGuides &&
                        allGuides.map((option: { id: string, title: string, category: {id: string, name: string}|null }) => (
                            <Option key={`guide-${option.id}`} value={option.id}>
                                {option.title}
                            </Option>
                        ))}
                    </Select>
                </Row>
                <Row style={{marginTop: 20}}>
                    <label>Reviewer*:</label>

                    <Select
                        onChange={val => reviewSelectChange(val)}
                        placeholder="Select a reviewer"
                        showSearch
                        filterOption={filterOption}
                        value={reviewSelectValue ? reviewSelectValue : null}
                    >
                        {
                            allUsers.map((user: IUser) => (
                                <Option key={`user-${user.slug}`} value={user.slug}>{user.firstName}</Option>
                            ))
                        }
                    </Select>
                </Row>
            </Modal>
        </>
    );
}

const mapStateToProps = (state: any) => ({
    user: state.user,
    currentProduct: state.work.currentProduct,
    userRole: state.work.userRole,
    allTags: state.work.allTags,
    loginUrl: state.work.loginUrl,
    registerUrl: state.work.registerUrl,
});

const mapDispatchToProps = () => ({});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(AddTask);
