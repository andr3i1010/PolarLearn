import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCodeCompare } from '@fortawesome/free-solid-svg-icons';

export default function Footer() {
    return (
        <footer>
            <div>
                <section
                    className="w-full bg-neutral-800 pt-8 pb-8 drop-shadow-xl drop-down font-[family-name:var(--font-geist-sans)]">
                    <div className="flex items-center space-x-2">
                        <div className="size-7">
                            <FontAwesomeIcon icon={faCodeCompare}/>
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