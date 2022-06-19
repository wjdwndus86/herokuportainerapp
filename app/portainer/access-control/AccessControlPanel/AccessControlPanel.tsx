import { useReducer } from 'react';

import { useUser } from '@/portainer/hooks/useUser';
import { r2a } from '@/react-tools/react2angular';
import { TeamMembership, TeamRole } from '@/react/portainer/users/teams/types';
import { useUserMembership } from '@/portainer/users/queries';

import { Widget, WidgetBody, WidgetTitle } from '@@/Widget';
import { Button } from '@@/buttons';

import { ResourceControlType, ResourceId } from '../types';
import { ResourceControlViewModel } from '../models/ResourceControlViewModel';

import { AccessControlPanelDetails } from './AccessControlPanelDetails';
import { AccessControlPanelForm } from './AccessControlPanelForm';

interface Props {
  resourceControl?: ResourceControlViewModel;
  resourceType: ResourceControlType;
  resourceId: ResourceId;
  disableOwnershipChange?: boolean;
  onUpdateSuccess(): void;
}

export function AccessControlPanel({
  resourceControl,
  resourceType,
  disableOwnershipChange,
  resourceId,
  onUpdateSuccess,
}: Props) {
  const [isEditMode, toggleEditMode] = useReducer((state) => !state, false);
  const { isAdmin } = useUser();

  const isInherited = checkIfInherited();

  const { isPartOfRestrictedUsers, isLeaderOfAnyRestrictedTeams } =
    useRestrictions(resourceControl);

  const isEditDisabled =
    disableOwnershipChange ||
    isInherited ||
    (!isAdmin && !isPartOfRestrictedUsers && !isLeaderOfAnyRestrictedTeams);

  return (
    <div className="row">
      <div className="col-sm-12">
        <Widget>
          <WidgetTitle title="Access control" icon="fa-eye" />
          <WidgetBody className="no-padding">
            <AccessControlPanelDetails
              resourceType={resourceType}
              resourceControl={resourceControl}
            />

            {!isEditDisabled && !isEditMode && (
              <div className="row">
                <div>
                  <Button color="link" onClick={toggleEditMode}>
                    <i className="fa fa-edit space-right" aria-hidden="true" />
                    Change ownership
                  </Button>
                </div>
              </div>
            )}

            {isEditMode && (
              <AccessControlPanelForm
                resourceControl={resourceControl}
                onCancelClick={() => toggleEditMode()}
                resourceId={resourceId}
                resourceType={resourceType}
                onUpdateSuccess={handleUpdateSuccess}
              />
            )}
          </WidgetBody>
        </Widget>
      </div>
    </div>
  );

  function handleUpdateSuccess() {
    onUpdateSuccess();
    toggleEditMode();
  }

  function checkIfInherited() {
    if (!resourceControl) {
      return false;
    }

    const inheritedVolume =
      resourceControl.Type === ResourceControlType.Container &&
      resourceType === ResourceControlType.Volume;
    const inheritedContainer =
      resourceControl.Type === ResourceControlType.Service &&
      resourceType === ResourceControlType.Container;
    const inheritedFromStack =
      resourceControl.Type === ResourceControlType.Stack &&
      resourceType !== ResourceControlType.Stack;

    return inheritedVolume || inheritedContainer || inheritedFromStack;
  }
}

function useRestrictions(resourceControl?: ResourceControlViewModel) {
  const { user, isAdmin } = useUser();

  const memberships = useUserMembership(user?.Id);

  if (!resourceControl || isAdmin || !user) {
    return {
      isPartOfRestrictedUsers: false,
      isLeaderOfAnyRestrictedTeams: false,
    };
  }

  if (resourceControl.UserAccesses.some((ua) => ua.UserId === user.Id)) {
    return {
      isPartOfRestrictedUsers: true,
      isLeaderOfAnyRestrictedTeams: false,
    };
  }

  const isTeamLeader =
    memberships.isSuccess &&
    isLeaderOfAnyRestrictedTeams(memberships.data, resourceControl);

  return {
    isPartOfRestrictedUsers: false,
    isLeaderOfAnyRestrictedTeams: isTeamLeader,
  };
}

// returns true if user is a team leader and resource is limited to this team
function isLeaderOfAnyRestrictedTeams(
  userMemberships: TeamMembership[],
  resourceControl: ResourceControlViewModel
) {
  return userMemberships.some(
    (membership) =>
      membership.Role === TeamRole.Leader &&
      resourceControl.TeamAccesses.some((ta) => ta.TeamId === membership.TeamID)
  );
}

export const AccessControlPanelAngular = r2a(AccessControlPanel, [
  'resourceControl',
  'resourceType',
  'disableOwnershipChange',
  'resourceId',
  'onUpdateSuccess',
]);
