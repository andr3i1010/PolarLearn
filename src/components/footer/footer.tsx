import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeCommit } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export default function Footer() {
    return (
        <footer>
            <div>
                <section
                    className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl font-[family-name:var(--font-geist-sans)]">
                    <div className="flex items-center space-x-2">
                        <div className="size-7 pt-0.5">
                            <FontAwesomeIcon icon={faCodeCommit as IconProp}/>
                        </div>
                        <p>
                            {process.env.REACT_APP_GIT_COMMIT}@{process.env.REACT_APP_GIT_BRANCH}
                        </p>
                    </div>
                </section>
            </div>
        </footer>
    );
}