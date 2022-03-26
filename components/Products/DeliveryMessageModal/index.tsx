import React, {useEffect, useState} from 'react';
import {Modal, Button, Select, Typography, Row} from 'antd';
import Attachments from "../../Attachments";
import {useQuery} from "@apollo/react-hooks";
import {RICH_TEXT_EDITOR_WIDTH} from "../../../utilities/constants";
import {GET_TASK_DELIVERY_ATTEMPT} from "../../../graphql/queries";
import parse from "html-react-parser";
import {getProp} from "../../../utilities/filters";

type Props = {
    modal: boolean,
    closeModal: Function,
    reject: Function,
    requestRevision: Function,
    submit: Function,
    taskId: number
};

type TaskDeliveryAttempt = {
    id: number,
    kind: number,
    createdAt: string,
    deliveryMessage: string,
    isCanceled: boolean,
    taskClaim: {
        id: number,
        task: {
            id: number,
            title: string
        }
    },
    attachments: [],
};

type Attachment = {
    id: number,
    path: string,
    name: string,
    fileType: string
};

const DeliveryMessageModal: React.SFC<Props> = ({
                                                    modal,
                                                    closeModal,
                                                    reject,
                                                    requestRevision,
                                                    submit,
                                                    taskId
                                                }) => {
    const [attempt, setAttempt] = useState<TaskDeliveryAttempt>({
        id: 0,
        kind: 0,
        createdAt: '',
        deliveryMessage: '',
        isCanceled: false,
        taskClaim: {
            id: 0,
            task: {
                id: 0,
                title: ''
            }
        },
        attachments: [],
    });

    const {data, error} = useQuery(GET_TASK_DELIVERY_ATTEMPT, {variables: {id: taskId}});

    useEffect(() => {
        if (data?.attempt) {
            setAttempt(data.attempt);
        }
    }, [data]);

    const handleCancel = () => {
        closeModal(!modal);
    };

    const handleReject = () => {
        reject();
    }

    const handleRequestRevision = () => {
        requestRevision();
    }

    const handleOk = () => {
        submit();
    }



    console.log(attempt)

    return (
        <>
            <Modal
                width={RICH_TEXT_EDITOR_WIDTH}
                visible={modal}
                onCancel={handleCancel}
                footer={[
                    <Button style={{borderRadius: 4, borderWidth: 0, marginRight: 8}} key="back"
                            onClick={handleReject}>
                        Unassign
                    </Button>,
                    <Button style={{borderRadius: 4, borderWidth: 0, marginRight: 8}} key="back"
                            onClick={handleRequestRevision}>
                        Ask for revision
                    </Button>,
                    <Button style={{borderRadius: 4}} key="submit" type="primary"
                            onClick={handleOk}>
                        Approve the work
                    </Button>]}
                maskClosable={false}
            >
                <Row>
                    <Typography.Text style={{fontSize: 22}} strong>Submission review</Typography.Text>
                </Row>
                <h3>Task: <strong>{attempt.taskClaim.task.title}</strong></h3>
                <p>Delivery message:</p>
                {parse(getProp(attempt, "deliveryMessage", ""))}
                <Attachments data={attempt.attachments} style={{backgroundColor: '#f4f4f4'}}/>
            </Modal>
        </>
    );
}

export default DeliveryMessageModal;
